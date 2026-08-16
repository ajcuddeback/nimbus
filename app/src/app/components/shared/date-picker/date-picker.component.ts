import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild
} from '@angular/core';
import { DateTime } from 'luxon';

/** Sunday-first, matching how US calendars are read. */
const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

interface DayCell {
  date: DateTime;
  iso: string;
  dayOfMonth: number;
  inMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isFocused: boolean;
  disabled: boolean;
}

/**
 * A calendar the user opens by clicking the date itself. Days after {@link max} are unselectable,
 * so the station can never be asked for a day it has not recorded yet.
 *
 * Keyboard: arrows move a day or a week, PageUp/PageDown a month, Home/End across the week,
 * Enter picks, Escape closes. The grid keeps focus and points at the active day with
 * `aria-activedescendant`, so navigating never yanks focus between 42 separate buttons.
 */
@Component({
  selector: 'app-date-picker',
  templateUrl: './date-picker.component.html',
  styleUrl: './date-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DatePickerComponent {
  /** The day currently on screen. */
  readonly value = input.required<DateTime>();

  /** Latest selectable day; everything after it is disabled. */
  readonly max = input(DateTime.now().startOf('day'));

  /** Trigger text. The caller already knows whether to say "Today" or a date. */
  readonly label = input.required<string>();

  readonly valueChange = output<DateTime>();

  protected readonly weekdayLabels = WEEKDAY_LABELS;
  protected readonly open = signal(false);

  /** The month the grid is showing, which is not necessarily the selected day's month. */
  private readonly visibleMonth = signal<DateTime>(DateTime.now().startOf('month'));

  /** The day the arrow keys are sitting on. Only meaningful while the panel is open. */
  protected readonly focusedDate = signal<DateTime>(DateTime.now().startOf('day'));

  private readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
  private readonly grid = viewChild<ElementRef<HTMLElement>>('grid');

  protected readonly monthTitle = computed(() => this.visibleMonth().toFormat('MMMM yyyy'));

  protected readonly canGoNextMonth = computed(() =>
    this.visibleMonth().plus({ months: 1 }) <= this.max().startOf('month')
  );

  protected readonly weeks = computed<DayCell[][]>(() => {
    const monthStart = this.visibleMonth().startOf('month');
    const selected = this.value().startOf('day');
    const focused = this.focusedDate().startOf('day');
    const max = this.max().startOf('day');
    const today = DateTime.now().startOf('day');

    // Luxon numbers weekdays Mon=1..Sun=7; `% 7` turns that into a Sunday-first column index.
    const leadingDays = monthStart.weekday % 7;
    const gridStart = monthStart.minus({ days: leadingDays });
    const rows = Math.ceil((leadingDays + (monthStart.daysInMonth ?? 31)) / 7);

    return Array.from({ length: rows }, (_, row) =>
      Array.from({ length: 7 }, (_, column) => {
        const date = gridStart.plus({ days: row * 7 + column });
        return {
          date,
          iso: date.toISODate() ?? '',
          dayOfMonth: date.day,
          inMonth: date.hasSame(monthStart, 'month'),
          isToday: date.hasSame(today, 'day'),
          isSelected: date.hasSame(selected, 'day'),
          isFocused: date.hasSame(focused, 'day'),
          disabled: date > max
        };
      })
    );
  });

  private readonly injector = inject(Injector);

  protected toggle(): void {
    if (this.open()) {
      this.close();
      return;
    }
    const selected = this.value().startOf('day');
    this.visibleMonth.set(selected.startOf('month'));
    this.focusedDate.set(selected);
    this.open.set(true);
    // The grid does not exist until this render lands, and it has to hold focus for the
    // arrow keys to reach the keydown handler.
    afterNextRender(() => this.grid()?.nativeElement.focus(), { injector: this.injector });
  }

  protected close(): void {
    if (!this.open()) {
      return;
    }
    this.open.set(false);
    this.trigger().nativeElement.focus();
  }

  protected shiftMonth(months: number): void {
    const next = this.visibleMonth().plus({ months });
    if (months > 0 && next > this.max().startOf('month')) {
      return;
    }
    this.visibleMonth.set(next);
  }

  protected selectDate(date: DateTime): void {
    if (date > this.max().startOf('day')) {
      return;
    }
    this.valueChange.emit(date.startOf('day'));
    this.close();
  }

  protected selectToday(): void {
    this.selectDate(DateTime.now().startOf('day'));
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.close();
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.selectDate(this.focusedDate());
      return;
    }

    const focused = this.focusedDate();
    const byDays: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    let next: DateTime | null = null;

    if (event.key in byDays) {
      next = focused.plus({ days: byDays[event.key] });
    } else if (event.key === 'PageUp') {
      next = focused.minus({ months: 1 });
    } else if (event.key === 'PageDown') {
      next = focused.plus({ months: 1 });
    } else if (event.key === 'Home') {
      next = focused.minus({ days: focused.weekday % 7 });
    } else if (event.key === 'End') {
      next = focused.plus({ days: 6 - focused.weekday % 7 });
    }

    if (!next) {
      return;
    }
    event.preventDefault();

    // Walking right or down stops at today rather than stepping into unrecorded days.
    const max = this.max().startOf('day');
    const capped = next > max ? max : next;
    this.focusedDate.set(capped);
    this.visibleMonth.set(capped.startOf('month'));
  }
}
