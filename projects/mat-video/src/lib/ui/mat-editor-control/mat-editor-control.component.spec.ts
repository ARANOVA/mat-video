import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatEditorControlComponent } from './mat-editor-control.component';

describe('MatEditorControlComponent', () => {
  let component: MatEditorControlComponent;
  let fixture: ComponentFixture<MatEditorControlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MatEditorControlComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MatEditorControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
