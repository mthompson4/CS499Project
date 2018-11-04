import { Component, OnInit, AfterViewInit, Input } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/database';
import { Events } from 'ionic-angular';
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
  public newFiles: Array<any> = [];
	filesArray: Array<Object> = [];
	directories: Array<Object> = [];
	isNightMode = true;
  ref: firebase.database.Reference;

  @Input() parentId:string;
  @Input() dataList:any [];

	constructor(
		db: AngularFireDatabase, 
    private _fileService: FileService,
		public events: Events
	) {
    	events.subscribe('color:switched', (toMode) => {
      		this.isNightMode = !(this.isNightMode);
    	});
	}

  ngOnInit(){
    this.ref = firebase.database().ref();
  }

  ngAfterViewInit(){
    console.log("file toggle view init");
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

  // Logic from: https://stackblitz.com/edit/angular-jvaawg?file=src%2Fapp%2Ftree.component.ts
  removeCurrentLevelItems=(datalist,parentId)=>{
    //logic here to remove current level items
    return datalist.filter(item=>item.parentId!=parentId)
  }

  toggleDir(dirPath, dirId){
    let dirRef = this.ref.child(dirPath);
    toggleHelper(dirId, dirRef);
  }

  deleteDir(dirPath){
    this.events.publish('directory:deleted', dirPath);
  }

	// send the file to the editor that was just clicked in the filelist
	fileClicked(file){
		this.events.publish('file:toggled', file);
    console.log("Clicked on file!", file);
	}

}
