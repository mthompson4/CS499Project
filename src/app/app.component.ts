import { Component} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { Events } from 'ionic-angular';
import { NgForm } from '@angular/forms';
import * as firebase from 'firebase/app';
import { FileService } from './file.service';
import { CodemirrorComponent } from 'ng2-codemirror';
import 'firebase/database';
import { environment } from '../environments/environment';

// #region External JS methods
declare function showModalError(message, modalId): any;
declare function closeModal(modalId): any;
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
  fileNames: Array<String> = [];
  dirNames: Array<String> = [];
  constructor(
    public events: Events,
    private _fileService: FileService
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
    this.ref = firebase.database().ref();
    this.editFileName();
    this.populateFileNamesArr();
    this.populateDirNamesArr();
  }

  saveClicked(){
    this.events.publish('file:saved');
  }

  renderFile(){
    this.events.publish('file:rendered');
  }

  populateFileNamesArr(){
    this._fileService.getAllFileNames().subscribe(names => 
      this.fileNames = names
    );
  }

  populateDirNamesArr(){
    this._fileService.getAllDirNames().subscribe(names => 
      this.dirNames = names
    );
  }


  // parse the inputted file name to see if it is valid
  parseFileName(filename){
    var errorCode;
    var isValid = true;
    if(filename == undefined || filename == ''){
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
      // check for duplicate file names
      for(var i=0; i<this.fileNames.length; ++i){
        if(filename.toLowerCase() == this.fileNames[i].toLowerCase()){
          return [false, "Filename already exists!"];
        }
      }
    }
    return [isValid, errorCode];
  }

  // parse the inputted directory name to see if is valid
  parseDirName(dirname){
    var errorCode;
    var isValid = true;
    if(dirname == undefined || dirname == ''){
      errorCode = "Directory names cannot be empty";
      isValid = false;
    }
    else if(dirname.includes(' ') == true){
      errorCode = "Directory names cannot include spaces";
      isValid = false;
    }
    else {
      console.log('is good');
    }
    return [isValid, errorCode];
  }


  fileCreated(form : NgForm) {
    console.log(form.value);
    let newFileName = form.value["fileName"];
    let returnValue = this.parseFileName(newFileName);
    let newDirName = form.value["toDirectory"]
    var newFileRef;
    if(newDirName == "" || newDirName == null || newDirName == undefined){
      console.log("No directory specified");
      newFileRef = this.ref.child('test-files').push();
    }
    else {
      console.log("blah blah blah");
      newFileRef = this.ref.child('test-files').child(newDirName).push();
    }

    if(returnValue[0] == false){
       showModalError(returnValue[1], '#newFileModalError');
    }
    else {
      this.currentFileName = newFileName;
      this.events.publish('file:created', newFileName, newFileRef);
      closeModal('#newFileModal');
    }
  }

  dirCreated(form : NgForm) {
    let newDirName = form.value["dirName"];
    let returnValue = this.parseDirName(newDirName);
    if(returnValue[0] == false){
       showModalError(returnValue[1], '#newDirModalError');
    }
    else {
      this.events.publish('directory:created', newDirName);
      closeModal('#newDirModal');
    }
  }

  dirDeleted(form : NgForm) {
    console.log(form.value);
    let dirToDelete = form.value["toDirectory"];
    if(dirToDelete == ""){
      console.log("none to delete");
    }
    else {
      this.events.publish('directory:deleted', dirToDelete);
      closeModal('#deleteDirModal');
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
