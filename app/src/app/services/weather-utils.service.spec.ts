import { DatePipe } from '@angular/common';
import { WeatherUtilsService } from './weather-utils.service';
import { WeatherData } from '../models/weather-data.interface';

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
});
