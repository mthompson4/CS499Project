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
import { AppRoutingModule } from './app-routing.module';

@NgModule({
  declarations: [
    AppComponent,
    FileToggleComponent
  ],
  imports: [
    BrowserModule,
    AngularFireModule.initializeApp(environment.firebase, 'test-project'),
    AngularFireDatabaseModule,
    CodemirrorModule,
    AppRoutingModule,
    FormsModule
  ],
  providers: [Events],
  bootstrap: [AppComponent]
})
export class AppModule { }