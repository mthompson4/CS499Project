import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { CodemirrorComponent } from 'ng2-codemirror';
import { FileToggleComponent } from './file-toggle/file-toggle.component';
import { EditorComponent } from './editor/editor.component';
import { Events } from 'ionic-angular';
import { environment } from '../environments/environment';
import * as firebase from 'firebase';
import { FormsModule } from '@angular/forms';
import { AngularFireModule } from '@angular/fire';
import { AngularFireDatabase } from '@angular/fire/database';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import { CookieService } from 'ngx-cookie-service';


describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule, AngularFireModule.initializeApp(environment.firebaseConfig), NgbModule],
      declarations: [ AppComponent, CodemirrorComponent, EditorComponent, FileToggleComponent],
      providers: [Events, AngularFireDatabase, CookieService]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it(`Should parse file name correctly'`, () => {
    var parseResults;
    parseResults = component.parseFileName("test.txt", "test-files");
    expect(parseResults[0]).toBeTruthy();

    parseResults = component.parseFileName("test", "test-files");
    expect(parseResults[0]).toBeFalsy();

  });

  it(`should work this file`, () => {
    var parseResults;
    parseResults = component.parseFileName("thisFile.py", "test-files");
    expect(parseResults[0]).toBeTruthy();
  })
});