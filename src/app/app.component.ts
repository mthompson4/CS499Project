import { Component} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { Events } from 'ionic-angular';
import * as firebase from 'firebase/app';
import 'firebase/database';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  ref: firebase.database.Reference;
  constructor(private route: ActivatedRoute) {}

  ngOnInit(){
    console.log(+this.route.snapshot.paramMap);
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

}
