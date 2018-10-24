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

export class FileToggleComponent implements AfterViewInit {
	// files: Observable<any[]>;
  public newFiles: Array<any> = [];
	filesArray: Array<Object> = [];
	directories: Array<Object> = [];
	isNightMode = true;
	constructor(
		db: AngularFireDatabase, 
    private _fileService: FileService,
		public events: Events
	) {
		
		// this.files = db.list('test-files').snapshotChanges().pipe(map(items => {
		// 	this.directories = [];
  //   		return items.map(a => {
  //     			const data = a.payload.val();
  //     			const key = a.payload.key;

  //     			if(data["filename"] == undefined){
  //     				console.log("Directory", key, data);
  //     				this.directories.push({key, data});
  //     				console.log(this.directories);
  //     				for(var i in data){
  //     					console.log(i, data[i]);
  //     				}
  //     			}
  //     			else {
  //     				console.log("File", key, data);
  //     				this.filesArray.push({key, data});
  //     			}

  //     			return {key, data};          
  //     		});

  //   	}));

    	events.subscribe('color:switched', (toMode) => {
      		this.isNightMode = !(this.isNightMode);
    	});
	}

  ngOnInit(){
    this.populateFilesArr();
  }

	ngAfterViewInit(){
		// toggleHelper();
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
    console.log(file);
	}
}
