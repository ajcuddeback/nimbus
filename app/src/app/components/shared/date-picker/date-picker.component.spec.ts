import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DateTime } from 'luxon';

import { DatePickerComponent } from './date-picker.component';

describe('DatePickerComponent', () => {
  let fixture: ComponentFixture<DatePickerComponent>;
  let element: HTMLElement;

  const selected = DateTime.fromISO('2026-08-10');
  const max = DateTime.fromISO('2026-08-16');

  function day(iso: string): HTMLButtonElement {
    const button = element.querySelector<HTMLButtonElement>(`#dp-day-${iso}`);
    if (!button) {
      throw new Error(`No cell rendered for ${iso}`);
    }
    return button;
  }

  function activeDay(): string | null {
    return element.querySelector('.dp-grid')!.getAttribute('aria-activedescendant');
  }

  function press(key: string): void {
    element.querySelector('.dp-grid')!.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    fixture.detectChanges();
  }

  function openPanel(): void {
    element.querySelector<HTMLButtonElement>('.dp-trigger')!.click();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [DatePickerComponent] }).compileComponents();

    fixture = TestBed.createComponent(DatePickerComponent);
    fixture.componentRef.setInput('value', selected);
    fixture.componentRef.setInput('label', 'August 10, 2026');
    fixture.componentRef.setInput('max', max);
    fixture.detectChanges();
    element = fixture.nativeElement;
  });

  it('opens on the selected day\'s month', () => {
    expect(element.querySelector('.dp-panel')).toBeNull();

    openPanel();

    expect(element.querySelector('.dp-head__month')!.textContent).toBe('August 2026');
    expect(day('2026-08-10').classList).toContain('is-selected');
  });

  it('disables every day after max', () => {
    openPanel();

    expect(day('2026-08-16').disabled).toBeFalse();
    expect(day('2026-08-17').disabled).toBeTrue();
    expect(day('2026-09-01').disabled).toBeTrue();
  });

  it('cannot browse past the month containing max', () => {
    openPanel();
    const nextMonth = element.querySelectorAll<HTMLButtonElement>('.dp-nav')[1];
    expect(nextMonth.disabled).toBeTrue();

    element.querySelectorAll<HTMLButtonElement>('.dp-nav')[0].click();
    fixture.detectChanges();

    expect(element.querySelector('.dp-head__month')!.textContent).toBe('July 2026');
    expect(element.querySelectorAll<HTMLButtonElement>('.dp-nav')[1].disabled).toBeFalse();
  });

  it('emits the clicked day and closes', () => {
    const picked: DateTime[] = [];
    fixture.componentInstance.valueChange.subscribe(date => picked.push(date));

    openPanel();
    day('2026-08-04').click();
    fixture.detectChanges();

    expect(picked.map(date => date.toISODate())).toEqual(['2026-08-04']);
    expect(element.querySelector('.dp-panel')).toBeNull();
  });

  it('moves the keyboard cursor by day, week, and month without passing max', () => {
    openPanel();
    expect(activeDay()).toBe('dp-day-2026-08-10');

    press('ArrowLeft');
    expect(activeDay()).toBe('dp-day-2026-08-09');

    press('ArrowDown');
    expect(activeDay()).toBe('dp-day-2026-08-16');

    // Walking further forward stops on max rather than stepping into unrecorded days.
    press('ArrowRight');
    press('ArrowDown');
    expect(activeDay()).toBe('dp-day-2026-08-16');

    press('PageUp');
    expect(activeDay()).toBe('dp-day-2026-07-16');
    expect(element.querySelector('.dp-head__month')!.textContent).toBe('July 2026');
  });

  it('picks the focused day on Enter and closes on Escape', () => {
    const picked: DateTime[] = [];
    fixture.componentInstance.valueChange.subscribe(date => picked.push(date));

    openPanel();
    press('ArrowLeft');
    press('Enter');

    expect(picked.map(date => date.toISODate())).toEqual(['2026-08-09']);
    expect(element.querySelector('.dp-panel')).toBeNull();

    openPanel();
    press('Escape');

    expect(element.querySelector('.dp-panel')).toBeNull();
    expect(picked.length).toBe(1);
  });
});
