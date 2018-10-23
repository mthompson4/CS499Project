import { Component} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { Events } from 'ionic-angular';
import { NgForm } from '@angular/forms';
import * as firebase from 'firebase/app';
import { CodemirrorComponent } from 'ng2-codemirror';
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
  currentFileKey = '';
  title = 'test';
  isCollapsed = false;
  isNightMode = true;
  constructor(
    public events: Events
  ) {
    events.subscribe('file:toggled', (filename, filekey) => {
      this.currentFileName = filename;
      this.currentFileKey = filekey;
    });
    events.subscribe('filename:updated', (filename, filekey) => {
      this.currentFileName = filename;
      this.currentFileKey = filekey;
    });
   }

  ngOnInit(){
    var firebaseConfig = {
      apiKey: "AIzaSyASvevZqe3FQvDIsdFmE3KeCRvKMBXffjU",
      authDomain: "cs499-team-4.firebaseapp.com",
      databaseURL: "https://cs499-team-4.firebaseio.com",
      projectId: "cs499-team-4",
      storageBucket: "files.cloud-code.net",
      messagingSenderId: "824045995979"
    };

    // firebase.initializeApp(firebaseConfig);
    this.ref = firebase.database().ref();
    this.editFileName();
  }

  saveClicked(){
    this.events.publish('file:saved');
  }

  renderFile(){
    this.events.publish('file:rendered');
  }

  parseFileName(filename){
    var errorCode;
    var isValid = true;
    if(filename == undefined){
      errorCode = "Filename cannot be empty";
      isValid = false;
    }
    else if (filename.includes('.') == false){
      errorCode = "Please enter a file extension";
      isValid = false;
    }
    else if(filename.includes(' ') == true){
      errorCode = "Filenames cannot include spaces";
      isValid = false;
    }
    else {
       var self = this;
       // check the file list to ensure no duplicate filenames
       this.ref.child('files').once('value').then(function(dataSnapshot) {
         dataSnapshot.forEach(function(childSnapshot) {
         var item = childSnapshot.val();
         if(item["filename"] != undefined){
           var currFileName = item["filename"];
           if(currFileName.toLowerCase() == filename.toLowerCase()){
             isValid = false;
             errorCode = "Filename already exists!";
             return true; // return true to exit async function
            }
           }
        });
      });
    }
    return [isValid, errorCode];
  }

  fileCreated(form : NgForm) {
    let newFileName = form.value["fileName"];
    let returnValue = this.parseFileName(newFileName);
    if(returnValue[0] == false){
       showModalError(returnValue[1]);
    }
    else {
      this.events.publish('file:created', newFileName);
      closeModal();
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
        let previousFileName = self.currentFileName;
        let newFileName = inputArea.value
        if(previousFileName.toLowerCase() == newFileName.toLowerCase()){
          inputArea.classList.toggle("hidden");
          fileLabel.classList.toggle("hidden");
          return
        }

        let returnValue = self.parseFileName(newFileName);
        if(returnValue[0] == false){
          alert(returnValue[1]);
          inputArea.classList.toggle("hidden");
          fileLabel.classList.toggle("hidden");
        }
        else {
          var updateValues = {"filename": inputArea.value};
          self.ref.child("files").child(self.currentFileKey).update(updateValues);
          self.events.publish('filename:edited', previousFileName, newFileName);
          inputArea.classList.toggle("hidden");
          fileLabel.classList.toggle("hidden");
          self.currentFileName = newFileName;
        }
       }
     });
  }
}
