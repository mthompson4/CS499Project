import { Component, OnInit } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/database';
import { Events } from 'ionic-angular';
import { Observable } from 'rxjs';

@Component({
  selector: 'file-toggle',
  templateUrl: './file-toggle.component.html',
  styleUrls: ['./file-toggle.component.css']
})

export class FileToggleComponent{
	items: Observable<any[]>;
	constructor(db: AngularFireDatabase, public events: Events) {
		this.items = db.list('files').valueChanges();
	}

	clicked(filename){
		this.events.publish('file:toggled', filename);
	}
}
