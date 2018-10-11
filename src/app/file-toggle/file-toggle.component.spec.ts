import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FileToggleComponent } from './file-toggle.component';

describe('FileToggleComponent', () => {
  let component: FileToggleComponent;
  let fixture: ComponentFixture<FileToggleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FileToggleComponent ]
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
