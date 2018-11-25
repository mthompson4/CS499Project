import { Component, AfterViewInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { Events } from 'ionic-angular';
import { CookieService } from 'ngx-cookie-service';
import { NgForm } from '@angular/forms';
import * as firebase from 'firebase/app';
import { FileService } from './file.service';
import { CodemirrorComponent } from 'ng2-codemirror';
import 'firebase/database';
import { environment } from '../environments/environment';
import { KeyboardShortcutsService } from 'ng-keyboard-shortcuts';

// #region External JS methods
declare function showModalError(message, modalId): any;
declare function modalListener(modalId, modalErrorId): any;
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

  ref: firebase.database.Reference; // ref to firebase database
  currentFileName = ''; // name of current file
  currentFile: any; // Object of current file 
  topLevelDir = 'test-files'; // top-level directory where everything is stored
  isCollapsed = false; // if the sidebar is collapsed or not
  isNightMode = true; // if it is night mode or not
  public filesArr: Array<any> = [];
  fileToUpload: File;

  @ViewChild('username-input') input;

  constructor(
    public events: Events,
    public cookie: CookieService, 
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
      { // Delete a directory
        key: ['cmd + i'],
        command: () => presentModal('#uploadImageModal'),
        preventDefault: true
      },

    ]);

    // User clicks a file from the file list
    events.subscribe('file:toggled', (file) => {
      this.currentFileName = file.name;
      this.currentFile = file;
    });

    // User changes a file from the tabs
    events.subscribe('filename:updated', (file) => {
      this.currentFileName = file.name;
      this.currentFile = file;
    });

    // User updates the image
    events.subscribe('image:updated', (image) => {
      this.updateImage(image);
    });
   }

  ngOnInit(){
    this.ref = firebase.database().ref();
    this.editFileName();
    this.populateFilesArr();
    modalListener('#newFileModal', '#newFileModalError');
  }

  ngAfterViewInit(){
    // grab the day/night mode cookie
    if(this.cookie.get("developer-mode") == "day"){
      this.isNightMode = true;
      this.setColorMode();
    }
  }

  // populate the array of files
  populateFilesArr(){
    this._fileService.getFiles().subscribe(files => {
      console.log("getting files");
      this.filesArr = files;
    });
  }

  // set an event for serving/rendering the file
  renderFile(){
    this.events.publish('file:rendered', this.currentFile);
  }

  /** 
   * parse the inputted file name to see if it is valid
   * @param {filename}: String - the filename to parse
   * @param {directory}: String - the path of the file's residing directory
  */
  parseFileName(filename, toDirectory){
    var errorCode;
    var isValid = true;

    // Don't allow files with spaces or without file extensions

    if(filename == undefined || filename == '' || filename == null){
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
      // check for duplicate file names in directories
      for(var i=0; i<this.filesArr.length; ++i){
        console.log(this.filesArr[i].name, this.filesArr[i].storagePath);
        if(this.filesArr[i].name.toLowerCase() == filename.toLowerCase()){
          // File has duplicate file name
          console.log("Checking paths", this.filesArr[i].storagePath, toDirectory);
          let newAbsPath = toDirectory + '/' + filename;
          if(this.filesArr[i].storagePath == newAbsPath){
            return [false, "Filename already exists in this directory"];
          }
        }
      }
    }
    return [isValid, errorCode];
  }

  /** 
   * parse the inputted directory name to see if is valid
   * @param {filename}: String - the filename to parse
   * @param {directory}: String - the path of the file's residing directory
  */
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

  /** 
   * Create a file object when the create file form is completed
   * @param {form}: NgForm - the returned form data
  */
  fileCreated(form : NgForm) {
    var newDirPath = form.value["toDirectory"];
    console.log(form.value);
    if(newDirPath == null || newDirPath == "" || newDirPath == undefined){
        newDirPath = this.topLevelDir;
    }
    let newFileName = form.value["fileName"];
    let returnValue = this.parseFileName(newFileName, newDirPath);
    if(returnValue[0] == false){
       showModalError(returnValue[1], '#newFileModalError');
    }
    else {  
      let newFileRef = this.ref.child(newDirPath).push();
      let fileAbsPath = newDirPath + '/' + newFileRef.key;
      let storagePath = newDirPath + '/' + newFileName;
      let splitPath = newDirPath.split('/');
      let parentNodeId = splitPath[splitPath.length-1];

      // Create a file object with various metatdata
      let file = {
        id: newFileRef.key,
        isFile: true,
        isImage: false,
        name: newFileName,
        isToggled: false,
        absPath: fileAbsPath,
        storagePath: storagePath,
        parent: parentNodeId,
        databaseRef: newFileRef,
        firepadRef: this.ref.child('firepad').child(newFileRef.key)
      }

      this.currentFileName = newFileName;
      this.events.publish('file:created', file);
      closeModal('#newFileModal');
    } 
  }


  /** 
   * Create a directory object when the create directory form is completed
   * @param {form}: NgForm - the returned form data
  */
  dirCreated(form : NgForm) {
    let newDirName = form.value["dirName"];
    let returnValue = this.parseDirName(newDirName);
    let parentDirPath = form.value["parentDirectory"];
    var newDirPath;
    if(returnValue[0] == false){
       showModalError(returnValue[1], '#newDirModalError');
    }
    else {
      // Either place the new directory nested or in the top-level directory
      if(parentDirPath == null || parentDirPath == "" || parentDirPath == undefined){
        newDirPath = this.topLevelDir + '/' + newDirName;
      }
      else { // nest the directory
        newDirPath = parentDirPath + '/' + newDirName;
      }
      let newDirRef = this.ref.child(newDirPath);
      let pushVals = {
        "isToggled": false
      }
      newDirRef.set(pushVals);

      closeModal('#newDirModal');
    }
  }


  updateImage(image){
    var storageRef = firebase.storage().ref().child(this.currentFile.storagePath);
    var self = this;
    storageRef.put(image).then(function(snapshot) {
      console.log("file updated!!!!!");
      self.events.publish('file:created', self.currentFile);
    });
  }

  saveImage(image, filePath, imageName){
    var storageRef = firebase.storage().ref().child(filePath).child(imageName);
    var self = this;
    storageRef.put(image).then(function(snapshot) {
      // Create a file object with various metatdata
      let newFileRef = self.ref.child(filePath).push();
      let fileAbsPath = filePath + '/' + newFileRef.key;
      let storagePath = filePath + '/' + imageName;
      let splitPath = filePath.split('/');
      let parentNodeId = splitPath[splitPath.length-1];
      
      let file = {
        id: newFileRef.key,
        isFile: true,
        isImage: true,
        name: imageName,
        isToggled: false,
        absPath: fileAbsPath,
        storagePath: storagePath,
        parent: parentNodeId,
        databaseRef: newFileRef,
        firepadRef: self.ref.child('firepad').child(newFileRef.key)
      }
      self.currentFileName = imageName;
      self.events.publish('file:created', file);
    });
  }

  /** 
   * Create an image object when the upload image form is completed
   * @param {form}: NgForm - the returned form data
  */
  imageUploaded(form : NgForm) {
    var newDirPath = form.value["toDirectory"]
    if(newDirPath == null || newDirPath == "" || newDirPath == undefined){
        newDirPath = this.topLevelDir;
    }
    if(this.fileToUpload == undefined) {
      console.log("no file provided");
    }
    else {
      console.log(this.fileToUpload);
      this.saveImage(this.fileToUpload, newDirPath, this.fileToUpload.name);
    }
    closeModal('#uploadImageModal');

  }

  // sets the current image when uploaded
  handleFileInput(files: FileList){
    this.fileToUpload = files.item(0);
  }


  /** 
   * Handle the event when a directory is deleted
   * @param {form}: NgForm - the returned form data
  */
  dirDeleted(form : NgForm) {
    let dirToDeletePath = form.value["toDirectory"];
    if(dirToDeletePath == ""){
      console.log("none to delete");
    }
    else {
      console.log(dirToDeletePath);
      this.events.publish('directory:deleted', dirToDeletePath);
      closeModal('#deleteDirModal');
    }
  }

  // Collapse the side bar
  collapse(){
    collapseSidebar(this.isCollapsed);
    this.isCollapsed = !this.isCollapsed;
  }

  // Set the color mode app-wide
  setColorMode(){
    this.events.publish('color:switched', this.isNightMode);
    toggleClass(this.isNightMode);
    this.isNightMode = !(this.isNightMode);
    if(this.isNightMode) {
      this.cookie.set("developer-mode", "night");
    } else {
      this.cookie.set("developer-mode", "day");
    }
  }

  // publish an event to delete the current file
  deleteFile(){
    this.events.publish('file:deleted', this.currentFile);
  }

  // Set a listener for the user to edit the current file name
  editFileName(){
    var fileLabel = document.getElementById("fileNameLabel");
    var inputArea = document.getElementById("editInput") as HTMLInputElement;
    var self = this;
    fileLabel.addEventListener("click", function(){
      fileLabel.classList.toggle("hidden");
      inputArea.classList.toggle("hidden");
    });
    inputArea.addEventListener("keyup", function(event) {

      if (event.key === "Enter") { // save the file name on pressing Enter
        let previousFileName = self.currentFileName;
        let newFileName = inputArea.value
        if(previousFileName.toLowerCase() == newFileName.toLowerCase()){
          inputArea.classList.toggle("hidden");
          fileLabel.classList.toggle("hidden");
          return
        }

        let returnValue = self.parseFileName(newFileName, self.currentFile.storagePath);
        if(returnValue[0] == false){
          alert(returnValue[1]);
          inputArea.classList.toggle("hidden");
          fileLabel.classList.toggle("hidden");
        }
        else {
          var updateValues = {"filename": inputArea.value};
          self.ref.child(self.currentFile.absPath).update(updateValues);
          self.events.publish('filename:edited', previousFileName, newFileName);
          inputArea.classList.toggle("hidden");
          fileLabel.classList.toggle("hidden");
          self.currentFileName = newFileName;
        }
      }
      else if(event.keyCode == 27){ // Esc button hit, dismiss input field
        inputArea.classList.toggle("hidden");
        fileLabel.classList.toggle("hidden");
      }
     });
  }
}
