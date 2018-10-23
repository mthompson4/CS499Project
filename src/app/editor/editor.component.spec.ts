import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { EditorComponent } from './editor.component';
import { CodemirrorComponent } from 'ng2-codemirror';
import { Events } from 'ionic-angular';
import { environment } from '../../environments/environment';
import * as firebase from 'firebase';

describe('EditorComponent', () => {
  let component: EditorComponent;
  let fixture: ComponentFixture<EditorComponent>;
  firebase.initializeApp(environment.firebaseConfig);
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditorComponent, CodemirrorComponent ],
      providers: [Events]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it(`Should have firebase ref defined'`, () => {
    expect(component.ref).toBeDefined();
  });
});
