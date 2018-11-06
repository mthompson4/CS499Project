import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FileToggleComponent } from './file-toggle.component';
import { AngularFireModule } from '@angular/fire';
import { AngularFireDatabase } from '@angular/fire/database';
import { Events } from 'ionic-angular';
import { FormsModule } from '@angular/forms';
import { environment } from '../../environments/environment';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { CookieService } from 'ngx-cookie-service';

describe('FileToggleComponent', () => {
  let component: FileToggleComponent;
  let fixture: ComponentFixture<FileToggleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule, AngularFireModule.initializeApp(environment.firebaseConfig), NgbModule],
      declarations: [ FileToggleComponent ],
      providers: [Events, AngularFireDatabase, CookieService]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FileToggleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
