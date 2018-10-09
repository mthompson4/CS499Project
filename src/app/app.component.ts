import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import * as firebase from 'firebase/app';
import 'firebase/database';
import 'firebase/storage';
import { CodemirrorComponent } from 'ng2-codemirror';
import * as Firepad from '../libs/firepad/dist/firepad';

import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/markdown/markdown';
import 'codemirror/mode/xml/xml';
import 'codemirror/addon/edit/closetag.js';
import 'codemirror/addon/comment/comment.js';
import 'codemirror/keymap/sublime.js';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit {
  @ViewChild(CodemirrorComponent) cm: CodemirrorComponent;

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

  ngAfterViewInit() {
    const codemirrorInstance = this.cm.instance;
    this.cm = codemirrorInstance;

    const firebaseConfig = {
      apiKey: "AIzaSyAKULc7VqbYUHAAehKR0bDf42WRLyTKch0",
      authDomain: "test-project-5632e.firebaseapp.com",
      databaseURL: "https://test-project-5632e.firebaseio.com",
      projectId: "test-project-5632e",
      storageBucket: "test-project-5632e.appspot.com",
      messagingSenderId: "214812957898"
    }

    firebase.initializeApp(firebaseConfig);

    this.ref = firebase.database().ref();
    this.firepad = Firepad.fromCodeMirror(this.ref, codemirrorInstance);

    this.updateTimestamp();
  }

  // Save a file to the cloud and update the save timestamp
  saveToCloud(){
    // const storageRef = FirebaseApp.storage().ref()
    var storageRef = firebase.storage().ref();
    // grab the timestamp element
    var saveTimestampElement = document.getElementById('saveTimestamp');
    saveTimestampElement.innerHTML = 'Saving......';
    // get the firebase storage ref
    var filename = 'index.html';
    var testRef = storageRef.child(filename);
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


}
