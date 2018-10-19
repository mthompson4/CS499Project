import { Component} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { Events } from 'ionic-angular';
import { NgForm } from '@angular/forms';
import * as firebase from 'firebase/app';
import 'firebase/database';

// #region External JS methods
declare function showModalError(message): any;
declare function closeModal(): any;
declare function filenameEditor(): any;
declare function collapseSidebar(collapse): any;
declare function toggleClass(isNightMode): any;
//#endregion

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  ref: firebase.database.Reference;
  currentFileName = '';
  isCollapsed = false;
  isNightMode = true;
  constructor(
    public events: Events
  ) {
    events.subscribe('file:toggled', (filename) => {
      this.currentFileName = filename;
    });
    events.subscribe('filename:updated', (filename) => {
      this.currentFileName = filename;
    });
   }

  ngOnInit(){
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
    this.editFileName();
  }

  saveClicked(){
    this.events.publish('file:saved');
  }

  renderFile(){
    this.events.publish('file:rendered');
  }

  fileCreated(form : NgForm) {
    let newFileName = form.value["fileName"];
    // check to see if filename was provided
    if (newFileName.includes('.') == false){
      showModalError("Please enter a file extension");
    }
    else {
       var self = this;
       var isDuplicate = false;
       // check the file list to ensure no duplicate filenames
       this.ref.child('files').once('value').then(function(dataSnapshot) {
         dataSnapshot.forEach(function(childSnapshot) {
         var item = childSnapshot.val();
         var currFileName = item["filename"];
         if(currFileName.toLowerCase() == newFileName.toLowerCase()){
           isDuplicate = true;
           return true;
         }
        });
        if (isDuplicate) {
          showModalError("Filename already exists!");
        }
        else {
          self.events.publish('file:created', newFileName);
          closeModal();
        }
      });
    }
  }

  collapse(){
    collapseSidebar(this.isCollapsed);
    this.isCollapsed = !this.isCollapsed;
  }

  setColorMode(){
    this.events.publish('color:switched', this.isNightMode);
    toggleClass(this.isNightMode);
    this.isNightMode = !(this.isNightMode);
  }

  deleteFile(){
    this.events.publish('file:deleted');
  }

  editFileName(){
    var fileLabel = document.getElementById("fileNameLabel");
    var inputArea = document.getElementById("editInput") as HTMLInputElement;
    var self = this;
    fileLabel.addEventListener("click", function(){
      fileLabel.classList.toggle("hidden");
      inputArea.classList.toggle("hidden");
    });
    inputArea.addEventListener("keyup", function(event) {
      if (event.key === "Enter") {
        console.log(inputArea.value);
        self.currentFileName = inputArea.value;
        inputArea.classList.toggle("hidden");
        fileLabel.classList.toggle("hidden");
        }
     });
  }
}
