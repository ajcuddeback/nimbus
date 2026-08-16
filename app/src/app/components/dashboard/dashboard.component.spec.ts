import { ComponentFixture, TestBed, discardPeriodicTasks, fakeAsync, tick } from '@angular/core/testing';
import { DatePipe } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideEchartsCore } from 'ngx-echarts';

import { DateTime, Settings } from 'luxon';

import { DashboardComponent } from './dashboard.component';
import { environment } from '../../../environments/environment';
import { CurrentWeather, WeatherData } from '../../models/weather-data.interface';

const API = environment.WEATHER_API_ENDPOINT;

const mockReading: WeatherData = {
  temp: 22.44,
  tempFormat: 'C',
  hum: 48.28,
  pr: 1012.93,
  prFormat: 'hPa',
  timestamp: Math.floor(Date.now() / 1000),
  stationId: 'test-station',
  windDirection: 180,
  windSpeed: 4,
  windSpeedFormat: 'mph',
  rainfall: 0,
  rainfallFormat: 'mm'
};

const mockCurrent: CurrentWeather = { reading: mockReading, stale: false, ageSeconds: 5 };

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let httpMock: HttpTestingController;

  /** Params of every date-range request seen so far, oldest first. */
  let rangeQueries: string[];

  /** What the range endpoint answers with; empty stands in for a day the station missed. */
  let rangeResponse: typeof mockReading[];

  /** Answers every request currently in flight and reports how many hit each endpoint. */
  function flushPending(): Record<'current' | 'today' | 'hour' | 'summary' | 'range', number> {
    const counts = { current: 0, today: 0, hour: 0, summary: 0, range: 0 };

    for (const request of httpMock.match(() => true)) {
      if (request.cancelled) {
        continue;
      }
      if (request.request.url.endsWith('/weatherData/current')) {
        counts.current++;
        request.flush(mockCurrent);
      } else if (request.request.url.endsWith('/weatherData/today')) {
        counts.today++;
        request.flush([mockReading]);
      } else if (request.request.url.endsWith('/weatherData/hour')) {
        counts.hour++;
        request.flush([mockReading]);
      } else if (request.request.url === `${API}/weatherSummary`) {
        counts.summary++;
        request.flush({ summary: 'Clear skies.' });
      } else if (request.request.url === `${API}/weatherData`) {
        counts.range++;
        rangeQueries.push(request.request.urlWithParams);
        request.flush(rangeResponse);
      } else {
        fail(`Unexpected request to ${request.request.urlWithParams}`);
      }
    }

    return counts;
  }

  /** Flips the toggle and lets the resulting subscription switch settle and issue its first poll. */
  function setLiveMode(live: boolean): void {
    (component as unknown as { setLiveMode(live: boolean): void }).setLiveMode(live);
    fixture.detectChanges();
    tick(0);
  }

  /**
   * Must run inside fakeAsync: the always-on poll subscribes as the component is constructed,
   * so a fixture built in beforeEach would schedule its timer outside the fake clock.
   */
  function createComponent(): void {
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    tick(0);
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        DatePipe,
        provideRouter([]),
        provideEchartsCore({ echarts: () => import('echarts') }),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
    .compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    rangeQueries = [];
    rangeResponse = [mockReading];
  });

  afterEach(() => {
    Settings.now = () => Date.now();
  });

  it('should create', fakeAsync(() => {
    createComponent();
    flushPending();

    expect(component).toBeTruthy();

    discardPeriodicTasks();
  }));

  it('polls only the current and today endpoints on the DAILY tab', fakeAsync(() => {
    createComponent();

    expect(flushPending()).toEqual({ current: 1, today: 1, hour: 0, summary: 0, range: 0 });

    // The 30s poll must stay just as narrow, not widen on later ticks.
    tick(30_000);
    fixture.detectChanges();
    expect(flushPending()).toEqual({ current: 1, today: 1, hour: 0, summary: 0, range: 0 });

    discardPeriodicTasks();
  }));

  it('adds the hour and summary endpoints only while the LIVE tab is showing', fakeAsync(() => {
    createComponent();
    flushPending();

    // Switching tabs swaps the whole poll, so the LIVE tab refetches current and today too.
    setLiveMode(true);
    expect(flushPending()).toEqual({ current: 1, today: 1, hour: 1, summary: 1, range: 0 });

    tick(30_000);
    fixture.detectChanges();
    expect(flushPending()).toEqual({ current: 1, today: 1, hour: 1, summary: 1, range: 0 });

    // Back to DAILY: the LIVE poll must be torn down, not merely ignored.
    setLiveMode(false);
    flushPending();
    tick(30_000);
    fixture.detectChanges();
    expect(flushPending()).toEqual({ current: 1, today: 1, hour: 0, summary: 0, range: 0 });

    discardPeriodicTasks();
  }));

  it('fetches a past day once from the range endpoint instead of polling', fakeAsync(() => {
    createComponent();
    flushPending();

    component.subtractDay();
    fixture.detectChanges();
    tick(0);

    // The day's readings come from the range endpoint; current still backs the hero and badge.
    expect(flushPending()).toEqual({ current: 1, today: 0, hour: 0, summary: 0, range: 1 });

    // Local midnight to the next local midnight: `to` is exclusive, so a plain day is exactly 24h.
    const [from, to] = rangeQueries[0].match(/from=(\d+)&to=(\d+)/)!.slice(1).map(Number);
    expect(to - from).toBe(24 * 60 * 60);

    // A finished day does not change, so nothing may poll it.
    tick(30_000);
    fixture.detectChanges();
    expect(flushPending()).toEqual({ current: 0, today: 0, hour: 0, summary: 0, range: 0 });

    discardPeriodicTasks();
  }));

  describe('at midnight', () => {
    const midnight = DateTime.fromISO('2026-08-17T00:00:00');

    /** Moves the wall clock across midnight and lets the one-second tick notice. */
    function crossMidnight(): void {
      Settings.now = () => midnight.plus({ seconds: 5 }).toMillis();
      tick(1000);
      fixture.detectChanges();
      flushPending();
      fixture.detectChanges();
    }

    beforeEach(() => {
      Settings.now = () => midnight.minus({ seconds: 10 }).toMillis();
    });

    it('carries a dashboard showing today onto the new day', fakeAsync(() => {
      createComponent();
      flushPending();
      fixture.detectChanges();
      expect(component.dateSelected().toISODate()).toBe('2026-08-16');
      expect(component.label()).toBe('Today');

      crossMidnight();

      expect(component.dateSelected().toISODate()).toBe('2026-08-17');
      expect(component.label()).toBe('Today');

      discardPeriodicTasks();
    }));

    it('leaves a deliberately chosen past day where it is', fakeAsync(() => {
      createComponent();
      flushPending();
      component.subtractDay();
      fixture.detectChanges();
      tick(0);
      flushPending();
      fixture.detectChanges();
      expect(component.dateSelected().toISODate()).toBe('2026-08-15');

      crossMidnight();

      expect(component.dateSelected().toISODate()).toBe('2026-08-15');
      expect(component.label()).toBe('August 15, 2026');

      discardPeriodicTasks();
    }));
  });

  it('explains itself instead of charting stale data when a day has no readings', fakeAsync(() => {
    createComponent();
    flushPending();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('app-area-chart').length).toBeGreaterThan(0);

    rangeResponse = [];
    component.subtractDay();
    fixture.detectChanges();
    tick(0);
    flushPending();
    fixture.detectChanges();

    const empty = fixture.nativeElement.querySelector('.db-empty');
    expect(empty).not.toBeNull();
    expect(empty.textContent).toContain('Nothing was recorded for');

    // The previous day's charts must not linger next to a "no readings" message.
    expect(fixture.nativeElement.querySelectorAll('app-area-chart').length).toBe(0);
    expect(fixture.nativeElement.querySelectorAll('.db-gauge-card').length).toBe(0);

    discardPeriodicTasks();
  }));
});
