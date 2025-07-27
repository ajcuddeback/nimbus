import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TempLineComponent } from './temp-line.component';

describe('TempLineComponent', () => {
  let component: TempLineComponent;
  let fixture: ComponentFixture<TempLineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TempLineComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TempLineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
