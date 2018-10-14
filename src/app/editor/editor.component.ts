import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, Event } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { Events } from 'ionic-angular';
import * as firebase from 'firebase/app';
import 'firebase/database';
import 'firebase/storage';
import { CodemirrorComponent } from 'ng2-codemirror';
import * as Firepad from '../../libs/firepad/dist/firepad';

import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/markdown/markdown';
import 'codemirror/mode/xml/xml';
import 'codemirror/mode/python/python';
import 'codemirror/addon/edit/closetag.js';
import 'codemirror/addon/comment/comment.js';
import 'codemirror/keymap/sublime.js';


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
    keyMap: "sublime",
    lineNumbers: true
  };
  firepad;
  ref: firebase.database.Reference;
  currentFileRef: firebase.database.Reference;

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
   }

  ngAfterViewInit() {
    const codemirrorInstance = this.codemirrorComponent.instance;
    this.cm = codemirrorInstance;
    
    this.ref = firebase.database().ref();
    this.currentFileRef = this.ref.child('files').child(this.currentFileKey);
    this.firepad = Firepad.fromCodeMirror(this.currentFileRef, codemirrorInstance,
      { userId: 69});

    this.updateTimestamp();
  }

  setFileInFirepad(filekey){
    this.currentFileRef = this.ref.child('files').child(filekey);
    this.firepad = Firepad.fromCodeMirror(this.currentFileRef, this.cm);
  }

  // Save a file to the cloud and update the save timestamp
  saveToCloud(){
    // const storageRef = FirebaseApp.storage().ref()
    var storageRef = firebase.storage().ref();
    // grab the timestamp element
    var saveTimestampElement = document.getElementById('saveTimestamp');
    saveTimestampElement.innerHTML = 'Saving......';
    
    // get the firebase storage ref
    var testRef = storageRef.child(this.currentFileName);
    // grab the contents of the editor as a string
    var message = this.firepad.getText();
    // putString saves the file to firebase storage
    testRef.putString(message).then(function(snapshot) {
      // grab the current timestamp
      let date = new Date();
      let saveTimestamp = date.toLocaleTimeString();
      saveTimestampElement.innerHTML = '<u>Last Saved at ' + saveTimestamp + '</u>';
      // set the ref in the firebase database with the timestamp
      var databaseRef = firebase.database().ref().child('/save');
      var postData = {
        "Timestamp": saveTimestamp
      };
      databaseRef.set(postData);
    });
  }

  // update the save timestamp when saved
  updateTimestamp(){
    var timestampRef = this.ref.child('/save');
    // listen for changes to the value of the timestamp
    timestampRef.on('value', function(snapshot){
      var saveTimestamp = snapshot.val()["Timestamp"];
      document.getElementById('saveTimestamp').innerHTML = '<u>Last Saved at ' + saveTimestamp + '</u>';
    })
  }

  // changes the file in the editor
  changeFile(filename, filekey){
    this.currentFileName = filename;
    this.currentFileKey = filekey;
    this.firepad.dispose();
    this.cm.setValue('');
    this.setFileInFirepad(filekey);
    this.changeMode(filename);
  }

  // change the mode to the provided syntax highlighting mode
  changeMode(filename) {
    let splitArray = filename.split('.'); // splits the filename into tokens delimited by .
    let extension = splitArray[splitArray.length - 1]; // get the last token in the array
    var newMode;
    if(extension == 'html') {
      newMode = 'xml';
    }
    else if(extension == 'js'){
      newMode = 'javascript';
    }
    else if(extension == 'py'){
      newMode = 'python';
    }
    console.log(newMode);
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
    databaseRef.push().set(postData);
  }

}
