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

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule, AngularFireModule.initializeApp(environment.firebaseConfig)],
      declarations: [ AppComponent, CodemirrorComponent, EditorComponent, FileToggleComponent],
      providers: [Events, AngularFireDatabase]
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
  it(`Should have title test'`, () => {
    expect(component.title).toBe('test');
  });
});