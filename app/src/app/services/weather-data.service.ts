import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, forkJoin, shareReplay, switchMap, timer } from 'rxjs';
import { CurrentWeather, WeatherData } from '../models/weather-data.interface';
import { environment } from '../../environments/environment';
import { ApiService } from './api.service';
import { ApiResponse } from '../models/api.interface';
import {DateTime} from 'luxon';

const POLL_INTERVAL_MS = 30_000;

/** Landing page: the single latest reading plus today's hourly aggregates and the AI summary. */
export interface CombinedWeatherData {
  current: ApiResponse<CurrentWeather | null>;
  today: ApiResponse<WeatherData[]>;
  summary: ApiResponse<{ summary: string }>;
}

/**
 * What the detailed dashboard renders. `day` is the hourly readings for whichever day is on
 * screen — today's, or a past day's. `currentHour` and `summary` are LIVE-tab only; on the
 * DAILY tab they are absent because those endpoints are never called.
 */
export interface DashboardWeather {
  current: ApiResponse<CurrentWeather | null>;
  day: ApiResponse<WeatherData[]>;
  currentHour?: ApiResponse<WeatherData[]>;
  summary?: ApiResponse<{ summary: string }>;
}

@Injectable({
  providedIn: 'root'
})
export class WeatherDataService {
  private readonly apiService = inject(ApiService);
  private readonly backendEndpoint = environment.WEATHER_API_ENDPOINT;
  private readonly combinedWeatherDataByStation = new Map<string, Observable<CombinedWeatherData>>();
  private readonly liveWeatherByStation = new Map<string, Observable<DashboardWeather>>();
  private readonly dailyWeatherByStation = new Map<string, Observable<DashboardWeather>>();

  /** The single most recent minute reading for a station, with the API's freshness verdict. */
  getCurrentWeatherData(stationId: string): Observable<ApiResponse<CurrentWeather | null>> {
    const params = new HttpParams().set('stationId', stationId);

    return this.apiService.get(`${this.backendEndpoint}/weatherData/current`, params);
  }

  /** Raw minute-by-minute readings for the current hour, in the browser's timezone. */
  getCurrentHourWeatherData(stationId: string): Observable<ApiResponse<WeatherData[]>> {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const params = new HttpParams().set('stationId', stationId).set('timezone', timeZone);

    return this.apiService.get(`${this.backendEndpoint}/weatherData/hour`, params);
  }

  getTodaysWeatherData(stationId: string): Observable<ApiResponse<WeatherData[]>> {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const params = new HttpParams().set('stationId', stationId).set('timezone', timeZone);

    return this.apiService.get(`${this.backendEndpoint}/weatherData/today`, params);
  }

  /**
   * Hourly aggregates for one calendar day. Bounds are epoch *seconds* (not millis), taken from
   * local midnight to local midnight the next day — `to` is exclusive, and going through the
   * next day's start rather than 23:59:59 keeps the window exact on days that gain or lose an
   * hour to daylight saving.
   */
  getWeatherDataForDate(stationId: string, date: DateTime): Observable<ApiResponse<WeatherData[]>> {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const from = Math.floor(date.startOf("day").toSeconds());
    const to = Math.floor(date.startOf("day").plus({ days: 1 }).toSeconds());

    const params = new HttpParams().set('stationId', stationId).set('timezone', timeZone).set('from', from).set('to', to);

    return this.apiService.get(`${this.backendEndpoint}/weatherData`, params);
  }

  getAISummary(stationId: string): Observable<ApiResponse<{ summary: string }>> {
    const params = new HttpParams().set('stationId', stationId);

    return this.apiService.get(`${this.backendEndpoint}/weatherSummary`, params);
  }

  getCombinedWeatherData(stationId: string): Observable<CombinedWeatherData> {
    if (!this.combinedWeatherDataByStation.has(stationId)) {
      const combined$ = timer(0, POLL_INTERVAL_MS).pipe(
        switchMap(() => forkJoin({
          current: this.getCurrentWeatherData(stationId),
          today: this.getTodaysWeatherData(stationId),
          summary: this.getAISummary(stationId)
        })),
        // refCount stops the polling timer once the last subscriber (page)
        // is destroyed; without it the interval would run forever.
        shareReplay({ bufferSize: 1, refCount: true })
      );
      this.combinedWeatherDataByStation.set(stationId, combined$);
    }
    return this.combinedWeatherDataByStation.get(stationId)!;
  }

  /** Everything the LIVE tab shows: minute readings and the AI summary, plus today's context. */
  getLiveWeather(stationId: string): Observable<DashboardWeather> {
    if (!this.liveWeatherByStation.has(stationId)) {
      const live$ = timer(0, POLL_INTERVAL_MS).pipe(
        switchMap(() => forkJoin({
          current: this.getCurrentWeatherData(stationId),
          day: this.getTodaysWeatherData(stationId),
          currentHour: this.getCurrentHourWeatherData(stationId),
          summary: this.getAISummary(stationId)
        })),
        shareReplay({ bufferSize: 1, refCount: true })
      );
      this.liveWeatherByStation.set(stationId, live$);
    }
    return this.liveWeatherByStation.get(stationId)!;
  }

  /**
   * Everything the DAILY tab shows: today's hourly readings, plus the current reading the
   * hero, gauges, and offline badge display. The hour and summary endpoints are not requested.
   */
  getDailyWeather(stationId: string): Observable<DashboardWeather> {
    if (!this.dailyWeatherByStation.has(stationId)) {
      const daily$ = timer(0, POLL_INTERVAL_MS).pipe(
        switchMap(() => forkJoin({
          current: this.getCurrentWeatherData(stationId),
          day: this.getTodaysWeatherData(stationId)
        })),
        shareReplay({ bufferSize: 1, refCount: true })
      );
      this.dailyWeatherByStation.set(stationId, daily$);
    }
    return this.dailyWeatherByStation.get(stationId)!;
  }

  /**
   * A past day's hourly readings. Fetched once rather than polled — a finished day does not
   * change. `current` still comes from the live endpoint, since the hero and the offline badge
   * always show the station's newest reading.
   */
  getWeatherForDate(stationId: string, date: DateTime): Observable<DashboardWeather> {
    return forkJoin({
      current: this.getCurrentWeatherData(stationId),
      day: this.getWeatherDataForDate(stationId, date)
    });
  }
}
