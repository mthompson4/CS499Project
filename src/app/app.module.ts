import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { FileToggleComponent } from './file-toggle/file-toggle.component';
import { AngularFireModule } from '@angular/fire';
import { AngularFireDatabase } from '@angular/fire/database';
import { AngularFireDatabaseModule } from '@angular/fire/database';
import { environment } from '../environments/environment';
import { Observable } from 'rxjs';
import { CodemirrorModule } from 'ng2-codemirror';
import { FormsModule } from '@angular/forms';
import { Events } from 'ionic-angular';
import { EditorComponent } from './editor/editor.component';
import * as firebase from 'firebase';


@NgModule({
  declarations: [
    AppComponent,
    FileToggleComponent,
    EditorComponent
  ],
  imports: [
    BrowserModule,
    AngularFireModule.initializeApp(environment.firebaseConfig),
    AngularFireDatabaseModule,
    CodemirrorModule,
    FormsModule
  ],
  providers: [Events],
  bootstrap: [AppComponent]
})
export class AppModule { }