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
import { CookieService } from 'ngx-cookie-service';
import { EditorComponent } from './editor/editor.component';
import { KeyboardShortcutsModule } from 'ng-keyboard-shortcuts';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import * as firebase from 'firebase';


// Declare app wide module imports
firebase.initializeApp(environment.firebaseConfig);
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
    FormsModule,
    KeyboardShortcutsModule,
    NgbModule
  ],
  providers: [Events, CookieService],
  bootstrap: [AppComponent]
})
export class AppModule { }