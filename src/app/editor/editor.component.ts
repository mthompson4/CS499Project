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
  @ViewChild(CodemirrorComponent) cm: CodemirrorComponent;
  currentFileName = 'index.html';
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
    events.subscribe('file:toggled', (filename) => {
      this.changeFile(filename);
    });
    events.subscribe('file:saved', () => {
      this.saveToCloud();
    });
    events.subscribe('file:created', (filename) => {
      this.createFile(filename);
    });
   }

  ngAfterViewInit() {
    const codemirrorInstance = this.cm.instance;
    this.cm = codemirrorInstance;
    
    this.ref = firebase.database().ref();
    this.currentFileRef = this.ref.child('files').child('index');
    this.firepad = Firepad.fromCodeMirror(this.currentFileRef, codemirrorInstance,
      { userId: 69});

    this.updateTimestamp();
  }

  setFileInFirepad(filename){
    let key = filename.split('.')[0];
    this.currentFileRef = this.ref.child('files').child(key);
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

  changeFile(filename){
    this.currentFileName = filename;
    this.firepad.dispose();
    this.cm.setValue('');
    this.setFileInFirepad(filename);
    this.changeMode(filename);
  }

  changeMode(filename) {
    let extension = filename.split('.')[1];
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

  createFile(filename){
    console.log("creating file", filename);
    var databaseRef = firebase.database().ref().child('files').child(filename.split('.')[0]);
    var postData = {
      "filename": filename
    };
    databaseRef.set(postData);
  }

}
