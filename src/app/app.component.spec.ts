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

  it(`should work this file`, () => {
    var parseResults = component.parseFileName("thisFile.py", "test-files");
    expect(parseResults[0]).toBe(true);
  })

  it('Parses file name test.txt', () => {
    var parseResult0 = component.parseFileName("test.txt", "test-files");
    expect(parseResult0[0]).toBe(true);
  })

  it('Parses file name thisFile.py', () => {
    var parseResult1 = component.parseFileName("thisFile.py", "test-files");
    expect(parseResult1[0]).toBe(true);
  })

  it('Parses file name (blank) as invalid', () => {
    var parseResult2 = component.parseFileName("", "test-files");
    expect(parseResult2[0]).toBe(false);
  })

  it('Parses file names with spaces as invalid', () => {
    var parseResult3 = component.parseFileName("this has a space.txt", "test-files");
    expect(parseResult3[0]).toBe(false);

  })

  it('Parses file names with an extension but no name as false', () => {
    var parseResult4 = component.parseFileName(".js", "test-files");
    expect(parseResult4[0]).toBe(false);
  })
});
