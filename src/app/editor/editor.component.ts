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
import 'codemirror/mode/css/css';

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
  cm: any; // reference to the codemirror object
  currentFileName; // the currently editing filename
  currentFilePath; // the path of the current file
  editingFilesArray: Array<any> = []; // an array of all the files to edit
  options = { // codemirror options
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
  firepad; // current firepad object
  ref: firebase.database.Reference; // firebase database reference
  currentFileRef: firebase.database.Reference; // reference to the current file in the database
  userId; // userid of the current user
  isSaving: boolean; // boolean that keeps track of whether or not the editor is currently saving
  isNightMode = true;

   /**
   * Represents the text editor class
   * @constructor
   * @param {events}: Events - A reference to a component handling Angular events
  */
  constructor(
    public events: Events
  ) {
    // define the events to subscribe to and the code the fires on those events
    events.subscribe('file:toggled', (filename, filekey) => { // A user selects a different file in the list
      this.changeFile(filename, filekey);
    });
    events.subscribe('file:saved', () => { // a user saves a file
      this.saveToCloud(this.currentFileName);
    });
    events.subscribe('file:created', (filename, fileRef) => { // a new file is created
      this.createFile(filename, fileRef);
    });
    events.subscribe('directory:created', (dirname) => { // a directory is created
      this.createDirectory(dirname);
    });
    events.subscribe('file:rendered', () => { // the file is to be served
      this.serveFile();
    });
    events.subscribe('color:switched', (wasNightMode) => { // switch between day & night mode
      this.changeTheme(wasNightMode);
      this.isNightMode = !this.isNightMode;
    });
    events.subscribe('file:deleted', () => { // a file is to be deleted
      this.deleteFile();
    });
    events.subscribe('directory:deleted', (dirname) => { // a directory is to be deleted
      this.deleteDirectory(dirname);
    });
    events.subscribe('filename:edited', (oldFileName, newFileName) => { // a filename has been edited
      this.filenameEdited(oldFileName, newFileName);
    });
    events.subscribe('file:updateListener', (cmInstance) => { // update the listener for autosave
      var self = this;
      var timeoutHandler;
      this.cm.on("change", function(cm, change) {
        if(!self.isSaving) {
          console.log("Waiting to save...");
          self.isSaving = true;
          timeoutHandler = setTimeout(function(){
            self.saveToCloud(self.currentFileName);
            console.log("Saved!!!");
          }, 5000);
        }
      });
    });
   }

  /* Code executes after the view inits: sets global objects and loads a file to the editor*/
  ngAfterViewInit() {
    // set the codemirror instance
    this.isSaving = false;
    const codemirrorInstance = this.codemirrorComponent.instance;
    this.cm = codemirrorInstance;
    this.ref = firebase.database().ref();
    this.userId = Math.floor(Math.random() * 9999).toString();
    // choose a file to load in the editor at default
    this.loadRandFile();
    this.events.publish('file:updateListener', this.cm);
  }

  /**
   * Sets a firepad listener to the current file and updates the userlist
   * @param {filekey}: String - A reference the current file's identifying key
  */
  setFileInFirepad(filekey){
    document.getElementById('userlist').innerHTML = '';
    this.currentFileRef = this.ref.child('test-files').child(filekey);
    this.firepad = Firepad.fromCodeMirror(this.currentFileRef, this.cm, { userId: this.userId});
    var userlist = FirepadUserList.fromDiv(this.currentFileRef.child('users'), document.getElementById('userlist'), this.userId);
    this.updateTimestamp();
  }

  /**
   * Matches the mimetype of a file
   * @param {inputFilename}: String - A reference to the inputted filename
  */
  matchMimeType(inputFilename){
    let splitArray = inputFilename.split('.'); // splits the filename into tokens delimited by .
    let extension = splitArray[splitArray.length - 1]; // get the last token in the array
    let mimeTypes = {
      'html': 'text/html',
      'js': 'application/javascript',
      'py': 'text/python',
      'md': 'text/markdown',
      'php': 'text/php',
      'css': 'text/css',
      'txt': 'text/plain'
    }
    let type = mimeTypes[extension];
    if(type != undefined){
      return type
    }
    else {
      return 'text/plain';
    }
  }

  /**
   * Saves a file to the cloud
   * @param {filename}: String - The filename to save
  */
  saveToCloud(filename){
    // grab the timestamp element
    var saveTimestampElement = document.getElementById('saveTimestamp');
    saveTimestampElement.innerHTML = 'Saving......';
    var storageRef = firebase.storage().ref().child('test-files');
    // get the firebase storage ref
    // grab the contents of the editor as a string
    let mimeType = this.matchMimeType(filename);
    var message = this.firepad.getText();
    var myblob = new Blob([message], {
        type: mimeType
    });
    // putString saves the file to firebase storage
    var self = this;
    let path = this.currentFilePath.split('/');
    var fileRef;
    if(path.length > 2){
      console.log("this is happening", path);
      fileRef = storageRef.child(path[1]).child(filename);
    }
    else {
      fileRef = storageRef.child(filename);
    }
    console.log(filename, fileRef.toString());
    fileRef.put(myblob).then(function(snapshot) {
      // grab the current timestamp
      let date = new Date();
      let saveTimestamp = date.toLocaleTimeString();
      saveTimestampElement.innerHTML = '<u>Last Saved at ' + saveTimestamp + '</u>';
      // set the ref in the firebase database with the timestamp
      var databaseRef = firebase.database().ref().child('save').child(self.currentFilePath);
      var postData = {
        "Timestamp": saveTimestamp
      };
      databaseRef.set(postData);
      self.isSaving = false;
    });
  }

  /**
   * Deletes the filename from the cloud storage bucket
   * @param {filename}: String - A reference to the inputted filename to delete
  */
  deleteFromStorage(filename){
    // Create a reference to the file to delete
    var storageRef = firebase.storage().ref().child('test-files');
    let path = this.currentFilePath.split('/');
    var fileRef;
    if(path.length > 1){
      fileRef = storageRef.child(path[0]).child(filename);
    }
    else {
      fileRef = storageRef.child(filename);
    }
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
   * When a filename is edited, delete the old reference in storage, and save a new entry
   * @param {oldFileName}: String - The previous filename
   * @param {newFileName}: String - The new filename
  */
  updateFileInCloud(oldFileName, newFileName){
    this.deleteFromStorage(oldFileName);
    this.saveToCloud(newFileName);
  }

  // Render the current file in a new browser window
  serveFile(){
    var url;
    let path = this.currentFilePath.split('/');
    var fileRef;
    if(path.length > 1){
      url = `http://files.cloud-code.net/test-files/${path[0]}/${this.currentFileName}`;
    }
    else {
      url = `http://files.cloud-code.net/test-files/${this.currentFileName}`;
    }
    window.open(url, '_blank');
  }

  // update the save timestamp when saved
  updateTimestamp(){
    var timestampRef = this.ref.child('save').child(this.currentFilePath);
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
  changeFile(filename, filePath){
    // create an object containing the filename & path to be stored for the editor tab interface
    this.events.publish('filename:updated', filename, filePath);
    let fileData = {
      path: filePath,
      name: filename
    }
    if (this.editingFilesArray.filter(f => f.name === fileData.name).length == 0) {
      this.editingFilesArray.push(fileData);
    }

    if(this.currentFileRef != undefined){ // if there is a current file, remove its user data for that user
      this.currentFileRef.child('users').child(this.userId).remove();
      this.firepad.dispose();
    }

    let editorTabs = document.getElementById('editorTabs').getElementsByTagName("a");
    let clickedId = filename + '-tab';
    for(var i=0; i<editorTabs.length; ++i){
      if(editorTabs[i].id == clickedId){
        editorTabs[i].classList.add('active');
      }
      else {
        editorTabs[i].classList.remove('active');
      }
    }
    // set attributes for new filename
    this.currentFileName = filename;
    this.currentFilePath = filePath;
    this.cm.setValue('');
    this.setFileInFirepad(filePath);
    this.changeMode(filename);
    this.updateTimestamp();
    this.events.publish('file:updateListener', this.cm);
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
  createFile(filename, fileRef){
    console.log('creating file');
    var postData = {
      "filename": filename
    };
    fileRef.set(postData);
    this.currentFileName = filename;
    // TODO: Find better way to do this, but this grabs the end path of the current file
    this.currentFilePath = fileRef.toString().split('https://cs499-team-4.firebaseio.com/test-files')[1];
    console.log(this.currentFilePath);
    this.saveToCloud(this.currentFileName);
    this.changeFile(filename, this.currentFilePath);
  }

  /**
   * Creates a directory and stores it in the firebase database
   * @param {dirname}: String - the name of the directory to create
  */
  createDirectory(dirname){
    console.log('creating a directory');
    var fileRef = this.ref.child('test-files').child(dirname).set(true);
  }

  /**
   * Creates a directory and stores it in the firebase database
   * @param {dirname}: String - the name of the directory to create
  */
  deleteDirectory(dirname){
    console.log('deleting directory', dirname);
    let dirRef = this.ref.child('test-files').child(dirname);
    dirRef.remove();
    this.deleteDirectoryFromStorage(dirname);
    var self = this;
    this.ref.child('test-files').once('value').then(function(dataSnapshot) {
      if(dataSnapshot.val() == null) {
        self.createFile('untitled', this.ref.child('test-files').push());
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

  /**
   * Delete the directory from Firebase cloud storage
   * @param {dirname}: String - the name of the directory to delete
  */
  deleteDirectoryFromStorage(dirname){
     // Create a reference to the file to delete
    var storageRef = firebase.storage().ref().child('test-files');
    var dirFileRef;
    
    // Delete the file
    var self = this;
    this.ref.child('test-files').child(dirname).once('value').then(function(dataSnapshot) {
      if(dataSnapshot.val() != null) {
        dataSnapshot.forEach(function(childSnapshot) {
          var item = childSnapshot.val();
          var filename = item['filename'];
          if(filename != undefined){
            dirFileRef = storageRef.child(dirname).child(filename);
            dirFileRef.delete().then(function() {
            // File deleted successfully
              console.log('directory deleted successfully!');
            }).catch(function(error) {
              // an error occurred!
              console.log('error deleting directory', error);
            });
          }
      });
      }
    });
  }


  // Delete the current file and switch to a new one
  deleteFile(){
    this.currentFileRef.remove();
    this.deleteFromStorage(this.currentFileName);
    // find the index within currently editing files
    let indexOfFile = this.findNameInEditingFiles(this.currentFileName);
    if(indexOfFile > -1){
      // delete the file from the tabs
      this.editingFilesArray.splice(indexOfFile, 1);

      if(this.editingFilesArray.length == 0){
        this.loadRandFile();
      }
      else {
        let fileToChange = this.editingFilesArray[indexOfFile-1];
        this.changeFile(fileToChange.name, fileToChange.path);
      }
    }
  }

  /**
   * Code that executes if the filename is edited
   * @param {oldFileName}: String - the name of the old file name
   * @param {newFileName}: String - the name of the new file name
  */
  filenameEdited(oldFileName, newFileName){
    let index = this.findNameInEditingFiles(oldFileName);
    if(index > -1){
      this.editingFilesArray[index].name = newFileName;
    }
    this.currentFileName = newFileName;
    this.updateFileInCloud(oldFileName, newFileName);
    this.changeMode(newFileName);
  }

  /**
   * searches the file list to either load a given file in the list,
   * or create an untitled file if none exist
  */
  loadRandFile(){
    var self = this;
    this.ref.child('test-files').once('value').then(function(dataSnapshot) {
      console.log(dataSnapshot.val());
      if(dataSnapshot.val() == null) {
        let newRef = self.ref.child('test-files').push();
        self.createFile('untitled', self.ref.child('test-files').push());
        self.events.publish('filename:updated', 'untitled');
      }
      else{
        dataSnapshot.forEach(function(childSnapshot) {
          var item = childSnapshot.val();
          let filepath  = childSnapshot.key;
          let filename = item["filename"];
          if(filename != undefined){
            self.changeFile(filename, filepath);
          }
          return true;
        });
      }
    });
  }


  /**
   * Find the filename in the currently editing files array
   * @param {filename}: String - the name of the file to find
  */
  findNameInEditingFiles(filename){
    for(var i=0; i<this.editingFilesArray.length; ++i){
      if(this.editingFilesArray[i].name == filename){
        return i;
      }
    }
    return -1;
}

  /**
   * Click handler for the file editing tabs
   * Either delete the tab or switch to it
   * @param {file}: Object - the file object corresponding to the tab
   * @param {event}: MouseEvent - an event that lets us know which element was clicked
  */
  setTab(file, event: MouseEvent){
    let clickedElement = event.srcElement;
    if(clickedElement.nodeName == "A"){ // user clicks on the file tab to switch files
      this.events.publish('filename:updated', file.name, file.path);
      this.changeFile(file.name, file.path);
    }
    else { // user clicks on the delete button

      if(this.editingFilesArray.length <= 1){ // disable deleting of tab if only one tab up
        return
      }
      // find the index within currently editing files
      let indexOfFile = this.findNameInEditingFiles(file.name);
      // delete the file from the tabs
      this.editingFilesArray.splice(indexOfFile, 1);
      if(file.name != this.currentFileName){ // user deletes a tab that is not the one the user is editing
        return
      }
      if(this.editingFilesArray.length == 0){ // if the user isn't editing any files, load a random one
        this.loadRandFile();
      }
      else { // load the adjacent file otherwise
        let fileToChange = this.editingFilesArray[indexOfFile-1];
        this.changeFile(fileToChange.name, fileToChange.path);
      }
    }
  }
}



