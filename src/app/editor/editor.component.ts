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

import 'codemirror/addon/edit/closetag.js';
import 'codemirror/addon/comment/comment.js';
import 'codemirror/addon/fold/xml-fold.js';
import 'codemirror/addon/edit/closebrackets.js';
import 'codemirror/addon/edit/matchbrackets.js';
import 'codemirror/addon/edit/matchtags.js';
import 'codemirror/keymap/sublime.js';

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
  currentFileName = 'index.html';
  currentFileKey = 'index';
  options = {
    mode: {
      name: 'xml',
    },
    tabSize: 2,
    autofocus: true,
    theme: 'default',
    lineWrapping: true,
    autoCloseTags: true,
    autoCloseBrackets: true,
    matchBrackets: true,
    matchTags: {bothTags: true},
    keyMap: "sublime",
    lineNumbers: true
  };
  firepad;
  ref: firebase.database.Reference;
  currentFileRef: firebase.database.Reference;
  userId;

  constructor(
  	private router: Router,
    private route: ActivatedRoute,
    public events: Events
  ) {
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

   }

  ngAfterViewInit() {
    const codemirrorInstance = this.codemirrorComponent.instance;
    this.cm = codemirrorInstance;
    
    this.ref = firebase.database().ref();
    this.currentFileRef = this.ref.child('files').child(this.currentFileKey);
    this.userId = Math.floor(Math.random() * 9999).toString();
    this.setFileInFirepad(this.currentFileKey);
  }

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
    // const storageRef = FirebaseApp.storage().ref()
    console.log(this.currentFileKey);
    var storageRef = firebase.storage().ref();
    // grab the timestamp element
    var saveTimestampElement = document.getElementById('saveTimestamp');
    saveTimestampElement.innerHTML = 'Saving......';
    
    // get the firebase storage ref
    var testRef = storageRef.child(this.currentFileName);
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
      var databaseRef = firebase.database().ref().child('/save').child(self.currentFileKey);
      var postData = {
        "Timestamp": saveTimestamp
      };
      databaseRef.set(postData);
    });
  }

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

  // changes the file in the editor
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

  // change the mode to the provided syntax highlighting mode
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

  // creates the file in the firebase database
  createFile(filename){
    console.log("creating file", filename);
    var databaseRef = firebase.database().ref().child('files');
    var postData = {
      "filename": filename
    };
    var fileRef = databaseRef.push();
    fileRef.set(postData);
    this.currentFileName = filename;
    this.currentFileKey = fileRef.key;
    this.saveToCloud();
    this.changeFile(filename, fileRef.key);
  }

}
