import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PressureLineComponent } from './pressure-line.component';

describe('PressureLineComponent', () => {
  let component: PressureLineComponent;
  let fixture: ComponentFixture<PressureLineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PressureLineComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PressureLineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
