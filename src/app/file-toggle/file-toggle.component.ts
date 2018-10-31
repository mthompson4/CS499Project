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
    // this.populateFilesArr();
    this.ref = firebase.database().ref();
  }

  populateFilesArr(){
    this._fileService.getFiles().subscribe(files => 
      this.newFiles = files
    );
  }
  removeCurrentLevelItems=(datalist,parentId)=>{
    //logic here to remove current level items
    return datalist.filter(item=>item.parentId!=parentId)
    // return datalist;
  }

  toggleDir(dirId){
    let dirRef = this.ref.child('test-files').child(dirId);
    toggleHelper(dirId, dirRef);
  }

  deleteDir(dirPath){
    this.events.publish('directory:deleted', dirPath);
  }

	// send the file to the editor that was just clicked in the filelist
	fileClicked(file){
		let filename = file.data["filename"];
		let filepath = file.path;
		this.events.publish('file:toggled', filename, filepath);
	}

}
