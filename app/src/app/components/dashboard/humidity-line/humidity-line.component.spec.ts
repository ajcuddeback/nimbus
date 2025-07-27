import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HumidityLineComponent } from './humidity-line.component';

describe('HumidityLineComponent', () => {
  let component: HumidityLineComponent;
  let fixture: ComponentFixture<HumidityLineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HumidityLineComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HumidityLineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
