import { Component, OnInit, AfterViewInit, Input } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/database';
import { Events } from 'ionic-angular';
import { CookieService } from 'ngx-cookie-service';
import { Observable } from 'rxjs';
import { FileService } from '../file.service';
import { map } from 'rxjs/operators';
import * as firebase from 'firebase/app';

declare function toggleHelper(dirId, dirRef): any;

@Component({
  selector: 'file-toggle',
  templateUrl: './file-toggle.component.html',
  styleUrls: ['./file-toggle.component.css'],
  providers: [FileService]
})

export class FileToggleComponent {

	filesArray: Array<Object> = []; // array of all files
	isNightMode = true; // is it in night mode or not
  ref: firebase.database.Reference; // reference to firebase database
  currentPopover: any; // the current popover element

  @Input() parentId:string;
  @Input() dataList:any [];

	constructor(
		db: AngularFireDatabase, 
    private _fileService: FileService,
    public events: Events, 
    public cookie: CookieService
	) {
    	events.subscribe('color:switched', (toMode) => {
      		this.isNightMode = !toMode;
    	});
	}

  ngOnInit(){
    this.ref = firebase.database().ref();
    // grab the night mode cookie
    if(this.cookie.get("developer-mode") == "day"){
      this.isNightMode = false;
    }
  }

  ngAfterViewInit(){
    // iterate through each file and add padding based on indentation level
    for(var i=0; i<this.dataList.length; i++){
      // ex: absPath = test-files/-LQHQtHCL332PHI6zrGy
      // test-files is top-level dir, so this level will = 0 b/c this file resides in it
      let fileNestedLevel = this.dataList[i].absPath.split('/').length -2;
      let filePadding = (15 * fileNestedLevel) + 3;
      var fileElement = document.getElementById(this.dataList[i].id);
      if(fileElement != undefined){
        fileElement.style.paddingLeft = `${filePadding}px`;
      }
    }
  }

  /**
   * Removes current level items from tree
   * Logic from: https://stackblitz.com/edit/angular-jvaawg?file=src%2Fapp%2Ftree.component.ts
   * @param {datalist}: Object - the list of files
   * @param {parentId}: String - the id of the current node's parent node
  */
  removeCurrentLevelItems=(datalist,parentId)=>{
    //logic here to remove current level items
    return datalist.filter(item=>item.parentId!=parentId)
  }


  /** 
   * Right click listener for the file list elements
   * @param {item}: Object - the item clicked
   * @param {popover}: Object - the popover element to present
  */
  onRightClick(item, popover) {
    // if no popover, open one
    if(this.currentPopover == undefined){
      popover.open();
      this.currentPopover = popover
    }
    else { // close the current popover, and open the new one
      this.currentPopover.close();
      this.currentPopover = popover;
      popover.open();
    }
    return false;
  }

  /** 
   * Toggle the directory in the file list
   * @param {dirPath}: String - the path of the directory
   * @param {dirId}: String - the DOM element ID of the directory element
  */
  toggleDir(dirPath, dirId){
    let dirRef = this.ref.child(dirPath);
    toggleHelper(dirId, dirRef);
  }

  /** 
   * Set an event to delete the directory
   * @param {dirPath}: String - the path of the directory
  */
  deleteDir(dirPath){
    this.events.publish('directory:deleted', dirPath);
  }

  /** 
   * send the file to the editor that was just clicked in the filelist
   * @param {file}: Object - the file clicked
  */
	fileClicked(file){
		this.events.publish('file:toggled', file);
	}

  /** 
   * serve the file that was just clicked in the filelist
   * @param {file}: Object - the file clicked
  */
  setServeFile(file){
    this.events.publish('file:rendered', file);
  }

  /** 
   * delete the file that was just clicked in the filelist
   * @param {file}: Object - the file clicked
  */
  setDeleteFile(file){
    this.events.publish('file:deleted', file);
  }

  /** 
   * delete the directory that was just clicked in the filelist
   * @param {dir}: Object - the directory clicked
  */
  setDeleteDirectory(dir){
    this.events.publish('directory:deleted', dir.absPath);
  }

}
