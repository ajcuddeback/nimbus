import { DatePipe } from '@angular/common';
import { STALE_AFTER_SECONDS, WeatherUtilsService } from './weather-utils.service';
import { CurrentWeather, WeatherData } from '../models/weather-data.interface';

function readingAt(timestamp: number, rainfallMm: number): WeatherData {
  return {
    temp: 25,
    tempFormat: 'C',
    hum: 50,
    pr: 1013,
    prFormat: 'hPa',
    timestamp,
    stationId: 'test-station',
    windDirection: 0,
    windSpeed: 1,
    windSpeedFormat: 'mph',
    rainfall: rainfallMm,
    rainfallFormat: 'mm'
  };
}

describe('WeatherUtilsService', () => {
  let service: WeatherUtilsService;

  beforeEach(() => {
    service = new WeatherUtilsService(new DatePipe('en-US'));
  });

  describe('getLiveRainfallMmSinceLastHourly', () => {
    const nowSeconds = Math.floor(Date.now() / 1000);

    it('ignores live readings already covered by the hourly data', () => {
      const hourly = [readingAt(nowSeconds - 7200, 5), readingAt(nowSeconds - 3600, 3)];
      const live = [
        readingAt(nowSeconds - 5400, 5), // overlaps the hourly window — must not count
        readingAt(nowSeconds - 60, 2),
        readingAt(nowSeconds, 1),
      ];
      expect(service.getLiveRainfallMmSinceLastHourly(hourly, live)).toBe(3);
    });

    it('only counts readings from today when there is no hourly data yet', () => {
      const startOfToday = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000);
      const live = [
        readingAt(startOfToday - 3600, 9), // yesterday — must not count
        readingAt(startOfToday + 60, 4),
      ];
      expect(service.getLiveRainfallMmSinceLastHourly([], live)).toBe(4);
    });

    it('returns 0 when there are no uncovered live readings', () => {
      const hourly = [readingAt(nowSeconds, 5)];
      const live = [readingAt(nowSeconds - 60, 5)];
      expect(service.getLiveRainfallMmSinceLastHourly(hourly, live)).toBe(0);
    });
  });

  describe('isStale', () => {
    const nowSeconds = Math.floor(Date.now() / 1000);

    function current(ageSeconds: number, stale: boolean): CurrentWeather {
      return { reading: readingAt(nowSeconds - ageSeconds, 0), stale, ageSeconds };
    }

    it('treats a fresh reading as live', () => {
      expect(service.isStale(current(30, false), nowSeconds)).toBe(false);
    });

    it('honours the API verdict even when the local age is still under the threshold', () => {
      expect(service.isStale(current(10, true), nowSeconds)).toBe(true);
    });

    it('goes stale between polls once the reading ages past the threshold', () => {
      // What the API said when we polled — fresh at the time.
      const polled = current(0, false);
      const laterNow = nowSeconds + STALE_AFTER_SECONDS + 1;
      expect(service.isStale(polled, laterNow)).toBe(true);
    });

    it('is not stale when there is no reading at all — that is the empty state', () => {
      expect(service.isStale(null, nowSeconds)).toBe(false);
    });
  });

  describe('formatElapsed', () => {
    it('formats seconds, minutes, hours and days', () => {
      expect(service.formatElapsed(42)).toBe('42s ago');
      expect(service.formatElapsed(365)).toBe('6m 05s ago');
      expect(service.formatElapsed(8000)).toBe('2h 13m ago');
      expect(service.formatElapsed(273_600)).toBe('3d 4h ago');
    });

    it('clamps a reading timestamped in the future to zero age', () => {
      const nowSeconds = Math.floor(Date.now() / 1000);
      expect(service.elapsedSince(readingAt(nowSeconds + 120, 0), nowSeconds)).toBe(0);
    });
  });
});
