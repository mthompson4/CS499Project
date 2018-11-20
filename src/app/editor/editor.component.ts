import { AfterViewInit, Component, ViewChild, Input } from '@angular/core';
import { ActivatedRoute, Router, Event } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { Events } from 'ionic-angular';
import { CookieService } from 'ngx-cookie-service';
import * as firebase from 'firebase/app';
import 'firebase/database';
import 'firebase/storage';
import { CodemirrorComponent } from 'ng2-codemirror';
import * as Firepad from '../../libs/firepad/dist/firepad';
import { FileService } from '../file.service';

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
import 'codemirror/addon/dialog/dialog.js';
import 'codemirror/addon/search/search.js';
import 'codemirror/addon/search/searchcursor.js';
import 'codemirror/addon/scroll/annotatescrollbar.js';
import 'codemirror/addon/search/matchesonscrollbar.js';
import 'codemirror/addon/search/jump-to-line.js';

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
  currentFile;
  isEditingImage = false; // needed b/c currentFile is undefined on init
  editingFilesArray: Array<any> = []; // an array of all the files to edit
  allFilesArray: Array<any> = []; // an array of all the files to edit
  
  options = { // codemirror options for the editor
    mode: {
      name: 'xml',
    },
    extraKeys: {"Alt-F": "findPersistent"},
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

  imageConfig = {
    ImageName: ' ',
    AspectRatios: ["4:3", "16:9"],
    ImageUrl: '',
    ImageType: 'image/png'
  }

  firepad; // current firepad object
  ref: firebase.database.Reference; // firebase database reference
  // currentFileRef: firebase.database.Reference; // reference to the current file in the database
  userId; // userid of the current user
  userColor; // color of current user
  userDisplayName;
  isSaving: boolean; // boolean that keeps track of whether or not the editor is currently saving
  isNightMode = true;
  topLevelDirectory = 'test-files'; // the directory name for the top-level, to be stored in firebase
  hasInitialized = false;

   /**
   * Represents the text editor class
   * @constructor
   * @param {events}: Events - A reference to a component handling Angular events
  */
  constructor(
    public events: Events,
    private _fileService: FileService,
    public cookie: CookieService
  ) {
    // define the events to subscribe to and the code the fires on those events
    events.subscribe('file:toggled', (file) => { // A user selects a different file in the list
      this.changeFile(file);
    });
    events.subscribe('file:saved', () => { // a user saves a file
      this.saveToCloud(this.currentFile);
    });
    events.subscribe('file:created', (file) => { // a new file is created
      this.fileCreated(file);
    });

    events.subscribe('file:rendered', (file) => { // the file is to be served
      this.serveFile(file);
    });
    events.subscribe('color:switched', (wasNightMode) => { // switch between day & night mode
      this.changeTheme(wasNightMode);
      this.isNightMode = !this.isNightMode;
    });
    events.subscribe('file:deleted', (file) => { // a file is to be deleted
      this.deleteFile(file);
    });
    events.subscribe('directory:deleted', (dirPath) => { // a directory is to be deleted
      this.deleteDirectory(dirPath);
    });
    events.subscribe('filename:edited', (oldFileName, newFileName) => { // a filename has been edited
      this.filenameEdited(oldFileName, newFileName);
    });
    events.subscribe('file:updateListener', (cmInstance) => { // update the listener for autosave
      var self = this;
      var timeoutHandler;
      this.cm.on("change", function(cm, change) {
        console.log("changed");
        if(!self.isSaving) {
          console.log("Waiting to save...");
          self.isSaving = true;
          timeoutHandler = setTimeout(function(){
            self.saveToCloud(self.currentFile);
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
    // random color code referenced from 
    // https://stackoverflow.com/questions/5092808/how-do-i-randomly-generate-html-hex-color-codes-using-javascript
    this.userColor = '#'+(Math.random()*0xFFFFFF<<0).toString(16);
    this.loadRandFile();
    this.events.publish('file:updateListener', this.cm);

    // See if the username cookie exists
    let usernameCookie = this.cookie.get("user-displayName");
    if(usernameCookie != undefined){
      this.userDisplayName = usernameCookie;
    }
    // Set a listener for the current username changing
    this.ref.child('users').child(this.userId).child('name').on("value", snapshot => {
      this.userDisplayName = snapshot.val();
      this.cookie.set("user-displayName", snapshot.val());
    });

    var self = this;
    setInterval(function(){
      self.updateTimestamp();
    }, 60000);
  }

  /* Load a random file from the database into the editor */
  loadRandFile(){
    this.hasInitialized = false;
    this._fileService.getFiles().subscribe(files => {
      this.allFilesArray = files;
      if(this.hasInitialized == false && files.length > 0){
        for(var i=0; i<files.length; ++i){
          if(files[i].isFile == true){
            this.changeFile(files[i]);
            this.hasInitialized = true;
            break;
          }
        }
      }
    });
  }

  /**
   * Sets the file in the editor to the inputted file
   * @param {file}: Object - A reference to the file to be set
  */
  setCurrentFile(file){
    this.currentFile = file;
    // if(file.isImage){
    //   this.isEditingImage = true;
    //   // this.isEditingImage = false;
    // }
    // else {
    //   this.isEditingImage = false;
    // }
  }

  /**
   * Sets a firepad listener to the current file and updates the userlist
   * @param {file}: Object - A reference to the file to set in Firepad
  */
  setFileInFirepad(file){
    document.getElementById('userlist').innerHTML = '';
    this.firepad = Firepad.fromCodeMirror(file.firepadRef, this.cm, { userId: this.userId, userColor: this.userColor});
    var userlist = FirepadUserList.fromDiv(this.ref.child('users'), document.getElementById('userlist'), this.userId, this.userDisplayName, this.userColor, file.name);
    var self = this;
    // workaround hack that forces a re-render of the image editor component b/c can't manually change images
    this.firepad.on('ready', function() {
      if(file.isImage){
        self.isEditingImage = true;
      }
    });
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
      'txt': 'text/plain', 
      'png': 'image/png',
      'gif': 'image/gif',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg'
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
   * @param {file}: Object - The file
  */
  saveToCloud(file){
    // grab the timestamp element
    var saveTimestampElement = document.getElementById('saveTimestamp');
    saveTimestampElement.innerHTML = 'Saving......';
    // set a reference to the file in the storage bucket
    var storageRef = firebase.storage().ref().child(this.currentFile.storagePath)
    // grab the contents of the editor as a string
    let mimeType = this.matchMimeType(file.name);
    var message = this.firepad.getText();
    var myblob = new Blob([message], {
        type: mimeType
    });
    var self = this;
    // put saves the file to firebase storage
    if(!file.isImage) {
      storageRef.put(myblob).then(function(snapshot) {
        // grab the current timestamp
        let date = new Date();
        let saveTimestamp = date.toLocaleTimeString();
        // let saveTimestamp = date.toString();
        // saveTimestampElement.innerHTML = '<u>Last Saved at ' + saveTimestamp + '</u>';
        saveTimestampElement.innerHTML = '<u>Changes Saved!</u>';
        // set the ref in the firebase database with the timestamp
        var databaseRef = firebase.database().ref().child('save').child(file.id);
        var postData = {
          "Timestamp": saveTimestamp
        };
        databaseRef.set(postData);
        self.isSaving = false;
      });
    }
  }

  /**
   * Deletes the file from cloud storage
   * @param {file}: Object - The file object to delete
  */
  deleteFromStorage(file){
    // Create a reference to the file to delete
    var storageRef = firebase.storage().ref().child(file.storagePath);
    storageRef.delete().then(function() {
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
    this.deleteFromStorage(this.currentFile);
    this.currentFile = { // update just the current file's name
      ...this.currentFile,
      name: newFileName
    };
    this.saveToCloud(this.currentFile);
  }

  // Render the current file in a new browser window
  serveFile(file){
    var url = `http://files.cloud-code.net/${file.storagePath}`;
    window.open(url, '_blank');
  }

  // update the save timestamp when saved
  updateTimestamp(){
    if(this.currentFile != undefined){
      var timestampRef = this.ref.child('save').child(this.currentFile.id);
      // listen for changes to the value of the timestamp
      timestampRef.once('value', function(snapshot){
        var saveTimestamp = snapshot.val()["Timestamp"];
        var timestampStr;
        // Relative time code referenced from: https://stackoverflow.com/questions/7709803/javascript-get-minutes-between-two-dates
        // let savedAtDate = +new Date(saveTimestamp);
        // let currentTime = +new Date();
        // let diffMs = (currentTime - savedAtDate);
        // let diffDays = Math.floor(diffMs / 86400000); // days
        // let diffHrs = Math.floor((diffMs % 86400000) / 3600000); // hours
        // let diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000); // minutes
        // // console.log(`Last Saved: ${diffDays} Days ${diffHrs} Hours and ${diffMins} Minutes ago`);

        // if(diffDays > 0){
        //   if (diffDays == 1) {
        //     timestampStr = `${diffDays} Days Ago`;
        //   }
        //   else {
        //     timestampStr = `${diffDays} Days Ago`;
        //   }
        // }
        // else if (diffHrs == 0) {
        //   if(diffMins == 0){
        //     timestampStr = `Less Than a Minute Ago`;
        //   }
        //   else if(diffMins == 1){
        //     timestampStr = `${diffMins} Minute Ago`;
        //   }
        //   else {
        //     timestampStr = `${diffMins} Minutes Ago`;
        //   }
        // }
        // else {
        //   timestampStr = `${diffHrs} Hours and ${diffMins} Minutes ago`;
        //}
        // document.getElementById('saveTimestamp').innerHTML = '<u>Last Saved ' + timestampStr + '</u>';
        document.getElementById('saveTimestamp').innerHTML = '<u>Last Saved ' + saveTimestamp + '</u>';

      })
    }
  }

  /**
   * Changes the file in the editor
   * @param {file}: Object - A reference the file object to change to
  */
  changeFile(file){
    if(file.isImage == true){ // set the image config details in editor
      this.setImageConfig(file);
      this.isEditingImage = false;
    }
    this.loadFile(file);
  }

  /**
   * Makes necessary changes to load an image
   * @param {image}: Object - A reference the image object to change to
  */
  setImageConfig(image){
    var storage = firebase.storage();
    var storageRef = storage.ref().child(image.storagePath);
    var url = `http://files.cloud-code.net/${image.storagePath}`;
    this.imageConfig = {
      ...this.imageConfig,
      ImageUrl: url
    };
  }

  /**
   * Makes necessary changes to load a file
   * @param {file}: Object - A reference the file object to change to
  */
  loadFile(file){
    this.isEditingImage = false;
    // create an object containing the filename & path to be stored for the editor tab interface
    this.events.publish('filename:updated', file);
    if (this.editingFilesArray.filter(f => f.name === file.name).length == 0) {
      this.editingFilesArray.push(file);
    }

    if(this.currentFile != undefined){ // if there is a current file, remove its user data for that user
      this.currentFile.firepadRef.child('users').child(this.userId).remove();
      this.firepad.dispose();
    }

    // Set only the clicked tab active
    let editorTabs = document.getElementById('editorTabs').getElementsByTagName("a");
    let clickedId = file.name + '-tab';
    for(var i=0; i<editorTabs.length; ++i){
      if(editorTabs[i].id == clickedId){
        editorTabs[i].classList.add('active');
      }
      else {
        editorTabs[i].classList.remove('active');
      }
    }
    // set attributes for new filename
    this.setCurrentFile(file);
    this.cm.setValue('');
    this.setFileInFirepad(file);
    this.changeMode(file.name);
    this.updateTimestamp();
    this.events.publish('file:updateListener', this.cm);
  }

  /**
   * Changes the file mode in the editor
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
   * Code that executes when a file gets created by the user
   * @param {file}: Object - The file object 
  */
  fileCreated(file){
    var postData = {
      "filename": file.name,
      "isImage": file.isImage
    };
    file.databaseRef.set(postData);

    if(file.isImage) {
      console.log("this is an image");
    }
    else {
      this.setCurrentFile(file);
      this.saveToCloud(file);
      this.changeFile(file);
    }
  }

  /**
   * Creates a directory and stores it in the firebase database
   * @param {dirPath}: String - the path of the directory to delete
  */
  deleteDirectory(dirPath){
    if(this.canDeleteDirectory(dirPath)){
      this.deleteDirectoryFromStorage(dirPath);
      this.loadRandFile();
    } 
    else {
      alert("Cannot Delete Directory: Other users are modifying files under this directory");
    }
  }

  /**
   * Checks to see if a directory can be deleted
   * @param {dirname}: String - the name of the directory to delete
  */
  canDeleteDirectory(dirPath){
    var canDelete = true;
    let dirPathSplit = dirPath.split('/');
    let dirName = dirPathSplit[dirPathSplit.length - 1]; // dirname is the last name in path
    this.hasInitialized = false;
    this._fileService.getFiles().subscribe(files => {
      if(this.hasInitialized == false && files.length > 0){
        for(var i=0; i<files.length; ++i){
          // check if file is in directory
          if(files[i].storagePath.includes(dirName) && files[i].isFile == true){
            if(this.canDeleteFile(files[i]) == false){
              canDelete = false;
            }
          }
        }
      }
    });
    return canDelete;
  }


  /**
   * Delete the directory from Firebase cloud storage
   * @param {dirname}: String - the name of the directory to delete
  */
  deleteDirectoryFromStorage(dirPath){
     // Create a reference to the file to delete
    var storageRef = firebase.storage().ref();
    let dirPathSplit = dirPath.split('/');
    let dirName = dirPathSplit[dirPathSplit.length - 1]; // dirname is the last name in path
    var hasDeleted = false;
    this.hasInitialized = false;
    this._fileService.getFiles().subscribe(files => {
      if(this.hasInitialized == false && files.length > 0){
        for(var i=0; i<files.length; ++i){
          if(files[i].storagePath.includes(dirName) && files[i].isFile == true){
            // check to see if user is currently editing that file
            let indexOfFile = this.findNameInEditingFiles(files[i].name);
            if(indexOfFile > -1){
              this.editingFilesArray.splice(indexOfFile, 1);
            }
            let fileStorageRef = storageRef.child(files[i].storagePath);
            console.log("REMOVING FILE", fileStorageRef.toString());
            fileStorageRef.delete().then(function (){
              console.log('file deleted successfully!');
            }).catch(function(error){
              console.log('error deleting file', error);
            });
          }
        }
       this.ref.child(dirPath).remove();
      }
    });
  }


  /**
   * Checks to see if you can delete the given file
   * @param {file}: String - the file to be deleted
  */
  canDeleteFile(file): boolean{
    var self = this;
    var canDelete = true;
    this.ref.child('users').once("value", snapshot => {
      snapshot.forEach(function(data) {
        let userData = data.val();
        if(data.key != self.userId) {
          if(userData["currentFile"] == file.name) { // another user is viewing that file
            canDelete = false;
          }
        }
      });
    })
    return canDelete
  }


  /**
   * Delete the current file and switch to a new one
   * @param {file}: String - the file to be deleted
  */
  deleteFile(file){

    if(this.canDeleteFile(file) == false){
      alert("Cannot delete file: Another user is currently editing it");
    }
    else {
      file.databaseRef.remove();
      file.firepadRef.remove();
      this.deleteFromStorage(file);
      // find the index within currently editing files
      let indexOfFile = this.findNameInEditingFiles(this.currentFile.name);
      if(indexOfFile > -1){
        // delete the file from the tabs
        this.editingFilesArray.splice(indexOfFile, 1);

        if(this.editingFilesArray.length == 0){
          this.loadRandFile();
        }
        else {
          let fileToChange = this.editingFilesArray[indexOfFile-1];
          this.changeFile(fileToChange);
        }
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
    this.currentFile.name = newFileName;
    this.updateFileInCloud(oldFileName, newFileName);
    this.changeMode(newFileName);
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
      this.events.publish('filename:updated', file);
      this.changeFile(file);
    }
    else { // user clicks on the delete button

      if(this.editingFilesArray.length <= 1){ // disable deleting of tab if only one tab up
        return
      }
      // find the index within currently editing files
      let indexOfFile = this.findNameInEditingFiles(file.name);
      // delete the file from the tabs
      this.editingFilesArray.splice(indexOfFile, 1);
      if(file.name != this.currentFile.name){ // user deletes a tab that is not the one the user is editing
        return
      }
      if(this.editingFilesArray.length == 0){ // if the user isn't editing any files, load a random one
        this.loadRandFile();
      }
      else { // load the adjacent file otherwise
        let fileToChange = this.editingFilesArray[indexOfFile-1];
        this.changeFile(fileToChange);
      }
    }
  }
}



