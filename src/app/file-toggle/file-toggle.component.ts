import { Component, OnInit, AfterViewInit } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/database';
import { Events } from 'ionic-angular';
import { Observable } from 'rxjs';
import { FileService } from '../file.service';
import { map } from 'rxjs/operators';

declare function toggleHelper(dirId): any;

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
    this.populateFilesArr();
  }

  populateFilesArr(){
    this._fileService.getFiles().subscribe(files => 
      this.newFiles = files
    );
  }

  toggleDir(dirId){
    console.log("Toggling Dir", dirId);
    toggleHelper(dirId);
  }


	// send the file to the editor that was just clicked in the filelist
	fileClicked(file){
		let filename = file.data["filename"];
		let filepath = file.path;
		this.events.publish('file:toggled', filename, filepath);
	}
}
