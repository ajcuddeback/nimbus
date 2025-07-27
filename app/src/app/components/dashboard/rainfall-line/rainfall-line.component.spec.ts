import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RainfallLineComponent } from './rainfall-line.component';

describe('RainfallLineComponent', () => {
  let component: RainfallLineComponent;
  let fixture: ComponentFixture<RainfallLineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RainfallLineComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RainfallLineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
