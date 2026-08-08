import { Injectable } from '@angular/core';
import { DatePipe } from '@angular/common';
import { CurrentWeather, WeatherData } from '../models/weather-data.interface';

/**
 * Mirrors the API's `weather.current.stale-after`. Only used to re-check staleness between polls —
 * the server's own verdict still wins, so drift between the two shows up as a slightly early or
 * late offline badge, never as a wrong one.
 */
export const STALE_AFTER_SECONDS = 300;

@Injectable({
  providedIn: 'root'
})
export class WeatherUtilsService {
  constructor(private datePipe: DatePipe) {}

  /**
   * Whether the station has gone quiet. The API's `stale` verdict decides it, but that verdict is
   * only refreshed when we poll; between polls the local clock keeps ticking, so we re-check the
   * reading's age too. Without that, a station dying just after a poll would read as live for the
   * rest of the interval.
   */
  isStale(current: CurrentWeather | null, nowSeconds: number): boolean {
    if (!current) {
      return false;
    }
    return current.stale || this.elapsedSince(current.reading, nowSeconds) > STALE_AFTER_SECONDS;
  }

  /** Seconds between a reading and now, clamped so clock skew can't produce a negative age. */
  elapsedSince(reading: WeatherData, nowSeconds: number): number {
    return Math.max(0, nowSeconds - reading.timestamp);
  }

  /** "42s ago" / "6m 05s ago" / "2h 13m ago" / "3d 4h ago". */
  formatElapsed(elapsedSeconds: number): string {
    if (elapsedSeconds < 60) {
      return `${elapsedSeconds}s ago`;
    }
    const minutes = Math.floor(elapsedSeconds / 60);
    if (minutes < 60) {
      return `${minutes}m ${String(elapsedSeconds % 60).padStart(2, '0')}s ago`;
    }
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours}h ${minutes % 60}m ago`;
    }
    return `${Math.floor(hours / 24)}d ${hours % 24}h ago`;
  }

  // Temperature formatting
  formatTemp(temp: number, format: 'f' | 'c'): string {
    if (format === 'f') {
      return this.formatToF(temp);
    } else {
      return this.formatToC(temp);
    }
  }

  formatToF(temp: number): string {
    return (temp * (9 / 5) + 32).toFixed(2) + ' °F';
  }

  formatToC(temp: number): string {
    return temp.toFixed(2) + ' °C';
  }

  formatTempShort(temp: number, format: 'f' | 'c'): string {
    if (format === 'f') {
      return (temp * (9 / 5) + 32).toFixed(0) + '°';
    } else {
      return temp.toFixed(0) + '°';
    }
  }

  // Feels like calculation using heat index and wind chill
  calculateFeelsLikeTemp(tempC: number, humidity: number, windMph: number): number {
    const windKph = windMph * 1.609;
    const tempF = (tempC * 9) / 5 + 32;

    // Heat index for hot and humid conditions
    if (tempC >= 27 && humidity >= 40) {
      const HI = -42.379 +
        2.04901523 * tempF +
        10.14333127 * humidity -
        0.22475541 * tempF * humidity -
        0.00683783 * tempF ** 2 -
        0.05481717 * humidity ** 2 +
        0.00122874 * tempF ** 2 * humidity +
        0.00085282 * tempF * humidity ** 2 -
        0.00000199 * tempF ** 2 * humidity ** 2;

      const feelsLikeC = (HI - 32) * 5 / 9;
      return Math.round(feelsLikeC * 10) / 10;
    }

    // Wind chill for cold and windy conditions
    if (tempC <= 10 && windKph > 4.8) {
      const V = windKph;
      const T_wc = 13.12 +
        0.6215 * tempC -
        11.37 * Math.pow(V, 0.16) +
        0.3965 * tempC * Math.pow(V, 0.16);
      return Math.round(T_wc * 10) / 10;
    }

    return Math.round(tempC * 10) / 10;
  }

  // Peak/min calculations — return Fahrenheit value, null when no data
  getPeakTempF(data: WeatherData[], latest?: WeatherData): number | null {
    const all = latest ? [...data, latest] : data;
    if (!all.length) return null;
    const peak = Math.max(...all.map(d => d.temp * 9 / 5 + 32));
    return isFinite(peak) ? peak : null;
  }

  getMinTempF(data: WeatherData[], latest?: WeatherData): number | null {
    const all = latest ? [...data, latest] : data;
    if (!all.length) return null;
    const min = Math.min(...all.map(d => d.temp * 9 / 5 + 32));
    return isFinite(min) ? min : null;
  }

  getPeakHumidity(weatherData: WeatherData[]): string {
    if (!weatherData || weatherData.length === 0) return 'Peak Humidity not available';
    const peak = Math.max(...weatherData.map(data => data.hum));
    if (peak === Number.NEGATIVE_INFINITY || peak === Number.POSITIVE_INFINITY) {
      return 'Peak Humidity not available';
    }
    return peak + '%';
  }

  // Conversions
  convertPressureToInches(pressure: number): number {
    return +(pressure * 0.02953).toFixed(2);
  }

  getWindDirectionLabel(degrees: number): string {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  }

  getRainTotal(weatherData: WeatherData[]): number {
    if (!weatherData || weatherData.length === 0) return 0;
    return Math.round(weatherData.reduce((acc, curr) => acc + (curr.rainfall / 25.4), 0) * 100) / 100;
  }

  /**
   * Rainfall (mm) from live readings not yet rolled into the hourly data —
   * i.e. newer than the latest hourly reading (or local midnight when the day
   * has no hourly readings yet). The live feed spans many hours and overlaps
   * the hourly readings, so summing the two feeds in full double-counts rain.
   */
  getLiveRainfallMmSinceLastHourly(todayHourly: WeatherData[], liveReadings: WeatherData[]): number {
    const startOfLocalDaySeconds = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000);
    const boundaryTimestamp = todayHourly.length
      ? Math.max(startOfLocalDaySeconds, ...todayHourly.map(reading => reading.timestamp))
      : startOfLocalDaySeconds;
    return liveReadings
      .filter(reading => reading.timestamp > boundaryTimestamp)
      .reduce((total, reading) => total + reading.rainfall, 0);
  }

  // Data gathering helpers
  gatherTimestamps(weatherData: WeatherData[]): string[] {
    return weatherData.map(data => {
      const date = new Date(data.timestamp * 1000);
      return this.datePipe.transform(date, 'h:mm a') ?? '';
    });
  }

  gatherTemps(weatherData: WeatherData[]): number[] {
    return weatherData.map(data => data.temp);
  }

  gatherHumidity(weatherData: WeatherData[]): number[] {
    return weatherData.map(data => data.hum);
  }

  gatherWindSpeeds(weatherData: WeatherData[]): number[] {
    return weatherData.map(data => data.windSpeed);
  }

  gatherPressures(weatherData: WeatherData[]): number[] {
    return weatherData.map(data => this.convertPressureToInches(data.pr));
  }

  gatherRainfall(weatherData: WeatherData[]): number[] {
    return weatherData.map(data => Math.round((data.rainfall / 25.4) * 100) / 100);
  }
}
