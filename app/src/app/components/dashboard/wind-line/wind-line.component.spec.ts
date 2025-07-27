import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WindLineComponent } from './wind-line.component';

describe('WindLineComponent', () => {
  let component: WindLineComponent;
  let fixture: ComponentFixture<WindLineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WindLineComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WindLineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
