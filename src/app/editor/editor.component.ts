import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, Event } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { Events } from 'ionic-angular';
import * as firebase from 'firebase/app';
import 'firebase/database';
import 'firebase/storage';
import { CodemirrorComponent } from 'ng2-codemirror';
import * as Firepad from '../../libs/firepad/dist/firepad';

// Import syntax highlighting modes
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/markdown/markdown';
import 'codemirror/mode/xml/xml';
import 'codemirror/mode/python/python';
import 'codemirror/mode/php/php';

// Codemirror addons
import 'codemirror/addon/edit/closetag.js';
import 'codemirror/addon/comment/comment.js';
import 'codemirror/addon/fold/xml-fold.js';
import 'codemirror/addon/edit/closebrackets.js';
import 'codemirror/addon/edit/matchbrackets.js';
import 'codemirror/addon/edit/matchtags.js';
import 'codemirror/keymap/sublime.js';

// external JS functions
declare var FirepadUserList: any;
declare function matchExtension(extension): any;

@Component({
  selector: 'code-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css']
})

export class EditorComponent {
  @ViewChild(CodemirrorComponent) private codemirrorComponent: CodemirrorComponent;
  cm: any;
  currentFileName;
  currentFileKey;
  options = {
    mode: {
      name: 'xml',
    },
    tabSize: 2,
    autofocus: true,
    theme: 'monokai',
    lineWrapping: true,
    autoCloseTags: true,
    autoCloseBrackets: true,
    matchBrackets: true,
    matchTags: {bothTags: true},
    keyMap: "sublime",
    lineNumbers: true,
  };
  firepad;
  ref: firebase.database.Reference;
  currentFileRef: firebase.database.Reference;
  userId;

   /**
   * Represents the text editor class
   * @constructor
   * @param {events}: Events - A reference to a component handling Angular events
  */
  constructor(
    public events: Events
  ) {
    // define the events to subscribe to and the code the fires on those events
    events.subscribe('file:toggled', (filename, filekey) => {
      this.changeFile(filename, filekey);
    });
    events.subscribe('file:saved', () => {
      this.saveToCloud();
    });
    events.subscribe('file:created', (filename) => {
      this.createFile(filename);
    });

    events.subscribe('file:rendered', () => {
      this.serveFile();
    });

    events.subscribe('color:switched', (wasNightMode) => {
      this.changeTheme(wasNightMode);
    });

    events.subscribe('file:deleted', () => {
      this.deleteFromDatabase();
    });
   }

  /* Code executes after the view inits: sets global objects and loads a file to the editor*/
  ngAfterViewInit() {
    // set the codemirror instance
    const codemirrorInstance = this.codemirrorComponent.instance;
    this.cm = codemirrorInstance;
    this.ref = firebase.database().ref();
    // choose a file to load in the editor at default
    this.initLoadFile();
  }

  /**
   * Sets a firepad listener to the current file and updates the userlist
   * @param {filekey}: String - A reference the current file's identifying key
  */
  setFileInFirepad(filekey){
    console.log(this.userId);
    document.getElementById('userlist').innerHTML = '';
    this.currentFileRef = this.ref.child('files').child(filekey);
    this.firepad = Firepad.fromCodeMirror(this.currentFileRef, this.cm, { userId: this.userId});
    var userlist = FirepadUserList.fromDiv(this.currentFileRef.child('users'), document.getElementById('userlist'), this.userId);
    this.updateTimestamp();
  }

  // Save a file to the cloud and update the save timestamp
  saveToCloud(){
    var storageRef = firebase.storage().ref().child('files');
    // grab the timestamp element
    var saveTimestampElement = document.getElementById('saveTimestamp');
    saveTimestampElement.innerHTML = 'Saving......';
    
    // get the firebase storage ref
    var testRef = storageRef.child(this.currentFileKey).child(this.currentFileName);
    // grab the contents of the editor as a string
    var message = this.firepad.getText();
    // putString saves the file to firebase storage
    var self = this;
    testRef.putString(message).then(function(snapshot) {
      // grab the current timestamp
      let date = new Date();
      let saveTimestamp = date.toLocaleTimeString();
      saveTimestampElement.innerHTML = '<u>Last Saved at ' + saveTimestamp + '</u>';
      // set the ref in the firebase database with the timestamp
      var databaseRef = firebase.database().ref().child('save').child(self.currentFileKey);
      var postData = {
        "Timestamp": saveTimestamp
      };
      databaseRef.set(postData);
    });
  }

  // Render the current file in a new browser window
  serveFile(){
    var contents = this.cm.getValue();
    var newWindow = window.open();
    newWindow.document.write(contents);
  }

  // update the save timestamp when saved
  updateTimestamp(){
    var timestampRef = this.ref.child('save').child(this.currentFileKey);
    // listen for changes to the value of the timestamp
    timestampRef.on('value', function(snapshot){
      var saveTimestamp = snapshot.val()["Timestamp"];
      document.getElementById('saveTimestamp').innerHTML = '<u>Last Saved at ' + saveTimestamp + '</u>';
    })
  }

  /**
   * Changes the file in the editor
   * @param {filekey}: String - A reference the current file's identifying key
   * @param {filename}: String - A reference the current file's filename
  */
  changeFile(filename, filekey){
    this.currentFileRef.child('users').child(this.userId).remove();
    this.currentFileName = filename;
    this.currentFileKey = filekey;
    this.firepad.dispose();
    this.cm.setValue('');
    this.setFileInFirepad(filekey);
    this.changeMode(filename);
    this.updateTimestamp();
  }

  /**
   * Changes the file in the editor
   * @param {filekey}: String - A reference the current file's identifying key
   * @param {filename}: String - A reference the current file's filename
  */
  changeMode(filename) {
    let splitArray = filename.split('.'); // splits the filename into tokens delimited by .
    let extension = splitArray[splitArray.length - 1]; // get the last token in the array
    var newMode = matchExtension(extension);
    this.options = {
      ...this.options,
      mode: newMode,
    };
    this.cm.setOption("mode", newMode);
  }

  /**
   * Changes the editor's theme to either night mode or day mode
   * @param {wasNightMode}: Boolean - True if the editor was on night mode
  */
  changeTheme(wasNightMode){
    var newTheme;
    if(wasNightMode){
      newTheme="default";
    }
    else {
      newTheme="monokai";
    }
    this.options = {
      ...this.options,
      theme: newTheme,
    };
    this.cm.setOption("theme", newTheme);
  }

  /**
   * Creates a file and stores it in the firebase database and storage bucket
   * @param {filename}: String - the name of the file to create
  */
  createFile(filename){
    console.log('creating file');
    var postData = {
      "filename": filename
    };
    var fileRef = this.ref.child('files').push();
    fileRef.set(postData);
    this.currentFileName = filename;
    this.currentFileKey = fileRef.key;
    this.saveToCloud();
    this.changeFile(filename, fileRef.key);
  }

  // deletes the current file from the database and storage
  deleteFromDatabase(){
    this.currentFileRef.remove();
    this.deleteFromStorage();
    var self = this;
    this.ref.child('files').once('value').then(function(dataSnapshot) {
      if(dataSnapshot.val() == null) {
        self.createFile('untitled');
        self.events.publish('filename:updated', 'untitled');
      }
      else{
        dataSnapshot.forEach(function(childSnapshot) {
          var item = childSnapshot.val();
          let key  = childSnapshot.key;
          self.events.publish('filename:updated', item['filename']);
          self.changeFile(item['filename'], key);
          return true;
      });
      }
    });
  }

  // delete the current file from cloud storage
  deleteFromStorage(){
    // Create a reference to the file to delete
    var storageRef = firebase.storage().ref().child('files');
    var fileRef = storageRef.child(this.currentFileKey).child(this.currentFileName);
    // Delete the file
    fileRef.delete().then(function() {
      // File deleted successfully
      console.log('file deleted successfully!');
    }).catch(function(error) {
      // an error occurred!
      console.log('error deleting file');
    });
  }


  /**
   * searches the file list to either load a given file in the list,
   * or create an untitled file if none exist
  */
  initLoadFile(){
    var self = this;
    this.ref.child('files').once('value').then(function(dataSnapshot) {
      if(dataSnapshot.val() == null) {
        self.createFile('untitled');
        self.events.publish('filename:updated', 'untitled');
      }
      else{
        dataSnapshot.forEach(function(childSnapshot) {
          var item = childSnapshot.val();
          let key  = childSnapshot.key;
          self.currentFileKey = key;
          self.currentFileName = item['filename'];
          self.events.publish('filename:updated', item['filename']);
          self.currentFileRef = self.ref.child('files').child(self.currentFileKey);
          self.userId = Math.floor(Math.random() * 9999).toString();
          self.setFileInFirepad(self.currentFileKey);
          return true;
      });
      }
    });
  }
}



