import { Component, OnInit } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/database';
import { Events } from 'ionic-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'file-toggle',
  templateUrl: './file-toggle.component.html',
  styleUrls: ['./file-toggle.component.css']
})

export class FileToggleComponent{
	files: Observable<any[]>;
	isNightMode = true;
	constructor(
		db: AngularFireDatabase, 
		public events: Events
	) {
		this.files = db.list('files').snapshotChanges().pipe(map(items => {            // <== new way of chaining
    		return items.map(a => {
      			const data = a.payload.val();
      			const key = a.payload.key;
      			return {key, data};          
      		});
    	}));

    	events.subscribe('color:switched', (toMode) => {
      		this.isNightMode = !(this.isNightMode);
    	});
	}

	// send the file to the editor that was just clicked in the filelist
	fileClicked(file){
		let filename = file.data["filename"];
		let filekey = file.key;
		this.events.publish('file:toggled', filename, filekey);
	}
}
