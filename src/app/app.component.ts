import { Component} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { Events } from 'ionic-angular';
import { NgForm } from '@angular/forms';
import * as firebase from 'firebase/app';
import 'firebase/database';

// #region External JS methods
declare function showModalError(): any;
declare function closeModal(): any;
//#endregion

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  ref: firebase.database.Reference;
  currentFileName = 'index.html';
  constructor(
    public events: Events
  ) {
    events.subscribe('file:toggled', (filename) => {
      this.currentFileName = filename;
    });
   }

  ngOnInit(){
    const firebaseConfig = {
      apiKey: "AIzaSyAKULc7VqbYUHAAehKR0bDf42WRLyTKch0",
      authDomain: "test-project-5632e.firebaseapp.com",
      databaseURL: "https://test-project-5632e.firebaseio.com",
      projectId: "test-project-5632e",
      storageBucket: "test-project-5632e.appspot.com",
      messagingSenderId: "214812957898"
    }
    firebase.initializeApp(firebaseConfig);
  }

  saveClicked(){
    this.events.publish('file:saved');
  }

  renderFile(){
    this.events.publish('file:rendered');
  }

  fileCreated(form : NgForm) {
    let newFileName = form.value["fileName"];
    // check to see if filename was provided
    if (newFileName.includes('.') == false){
      showModalError();
    }
    else {
      this.events.publish('file:created', newFileName);
      closeModal()
    }
  }

}
