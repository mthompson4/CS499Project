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
import { KeyboardShortcutsService } from 'ng-keyboard-shortcuts';

// #region External JS methods
declare function showModalError(message, modalId): any;
declare function closeModal(modalId): any;
declare function presentModal(modalId): any;
declare function filenameEditor(): any;
declare function collapseSidebar(collapse): any;
declare function toggleClass(isNightMode): any;
//#endregion

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [ KeyboardShortcutsService ]
})
export class AppComponent {
  ref: firebase.database.Reference;
  currentFileName = '';
  currentFilePath = '';
  topLevelDir = 'test-files';
  title = 'test';
  isCollapsed = false;
  isNightMode = true;
  fileNames: Array<String> = [];
  dirNames: Array<String> = [];
  public filesArr: Array<any> = [];

  constructor(
    public events: Events,
    private _fileService: FileService,
    private keyboard: KeyboardShortcutsService
  ) {

    // Setup keyboard shortcuts
    this.keyboard.add([
      {
        // Create New File
        key: ['cmd + e'],
        command: () => presentModal('#newFileModal'),
        preventDefault: true
      },
      { // Create New Directory
        key: ['cmd + d'],
        command: () => presentModal('#newDirModal'),
        preventDefault: true
      },
      { // Serve the file
        key: ['cmd + j'],
        command: () => this.renderFile(),
        preventDefault: true
      },
      { // Delete the current file
        key: ['cmd + k'],
        command: () => this.deleteFile(),
        preventDefault: true
      },
      { // Delete a directory
        key: ['cmd + b'],
        command: () => presentModal('#deleteDirModal'),
        preventDefault: true
      },

    ]);

    events.subscribe('file:toggled', (filename, filepath) => {
      this.currentFileName = filename;
      this.currentFilePath = filepath;
    });
    events.subscribe('filename:updated', (filename, filepath) => {
      this.currentFileName = filename;
      this.currentFilePath = filepath;
    });
   }

  ngOnInit(){
    this.ref = firebase.database().ref();
    this.editFileName();
    this.populateFileNamesArr();
    this.populateDirNamesArr();
    this.populateFilesArr();
  }

  populateFilesArr(){
    this._fileService.getFiles().subscribe(files =>
      this.filesArr = files
    );
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
    let newDir = form.value["toDirectory"]
    var newFilePath;
    if(newDir == "" || newDir == null || newDir == undefined){
      newFilePath = this.topLevelDir;
    }
    else {
      newFilePath = newDir.absPath;
    }

    if(returnValue[0] == false){
       showModalError(returnValue[1], '#newFileModalError');
    }
    else {
      this.currentFileName = newFileName;
      this.events.publish('file:created', newFileName, newFilePath);
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
          self.ref.child("test-files").child(self.currentFilePath).update(updateValues);
          self.events.publish('filename:edited', previousFileName, newFileName);
          inputArea.classList.toggle("hidden");
          fileLabel.classList.toggle("hidden");
          self.currentFileName = newFileName;
        }
       }
     });
  }
}
