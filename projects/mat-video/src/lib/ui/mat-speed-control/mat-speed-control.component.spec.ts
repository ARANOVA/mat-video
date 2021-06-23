import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatSpeedControlComponent } from './mat-speed-control.component';

describe('MatSpeedControlComponent', () => {
  let component: MatSpeedControlComponent;
  let fixture: ComponentFixture<MatSpeedControlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MatSpeedControlComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MatSpeedControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
