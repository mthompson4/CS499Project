import { Component, OnInit } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/database';
import { Events } from 'ionic-angular';
import { Observable } from 'rxjs';
import { ActivatedRoute, Router, Event } from '@angular/router';

@Component({
  selector: 'file-toggle',
  templateUrl: './file-toggle.component.html',
  styleUrls: ['./file-toggle.component.css']
})

export class FileToggleComponent{
	items: Observable<any[]>;
	constructor(
		db: AngularFireDatabase, 
		public events: Events,
		private router: Router
	) {
		this.items = db.list('files').valueChanges();
	}

	fileClicked(){
		console.log("clicked");
		let filename = "index.html";
		this.events.publish('file:toggled', filename);
		let path = "/editor/" + filename;
		this.router.navigate([path]);
	}
}
