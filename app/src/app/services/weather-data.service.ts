import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, forkJoin, shareReplay, switchMap, timer } from 'rxjs';
import { CurrentWeather, WeatherData } from '../models/weather-data.interface';
import { environment } from '../../environments/environment';
import { ApiService } from './api.service';
import { ApiResponse } from '../models/api.interface';

const POLL_INTERVAL_MS = 30_000;

/** Landing page: the single latest reading plus today's hourly aggregates and the AI summary. */
export interface CombinedWeatherData {
  current: ApiResponse<CurrentWeather | null>;
  today: ApiResponse<WeatherData[]>;
  summary: ApiResponse<{ summary: string }>;
}

/** Detailed page: everything the landing page needs plus this hour's minute-by-minute readings. */
export interface DetailedWeatherData extends CombinedWeatherData {
  currentHour: ApiResponse<WeatherData[]>;
}

@Injectable({
  providedIn: 'root'
})
export class WeatherDataService {
  private readonly apiService = inject(ApiService);
  private readonly backendEndpoint = environment.WEATHER_API_ENDPOINT;
  private readonly combinedWeatherDataByStation = new Map<string, Observable<CombinedWeatherData>>();
  private readonly detailedWeatherDataByStation = new Map<string, Observable<DetailedWeatherData>>();

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

  getDetailedWeatherData(stationId: string): Observable<DetailedWeatherData> {
    if (!this.detailedWeatherDataByStation.has(stationId)) {
      const combined$ = timer(0, POLL_INTERVAL_MS).pipe(
        switchMap(() => forkJoin({
          current: this.getCurrentWeatherData(stationId),
          currentHour: this.getCurrentHourWeatherData(stationId),
          today: this.getTodaysWeatherData(stationId),
          summary: this.getAISummary(stationId)
        })),
        shareReplay({ bufferSize: 1, refCount: true })
      );
      this.detailedWeatherDataByStation.set(stationId, combined$);
    }
    return this.detailedWeatherDataByStation.get(stationId)!;
  }
}
