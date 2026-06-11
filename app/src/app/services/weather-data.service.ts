import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, forkJoin, shareReplay, switchMap, timer } from 'rxjs';
import { WeatherData } from '../models/weather-data.interface';
import { environment } from '../../environments/environment';
import { ApiService } from './api.service';
import { ApiResponse } from '../models/api.interface';

const POLL_INTERVAL_MS = 30_000;

export interface CombinedWeatherData {
  current: ApiResponse<WeatherData[]>;
  today: ApiResponse<WeatherData[]>;
  summary: ApiResponse<{ summary: string }>;
}

@Injectable({
  providedIn: 'root'
})
export class WeatherDataService {
  private readonly apiService = inject(ApiService);
  private readonly backendEndpoint = environment.WEATHER_API_ENDPOINT;
  private readonly combinedWeatherDataByStation = new Map<string, Observable<CombinedWeatherData>>();

  getCurrentWeatherData(stationId: string): Observable<ApiResponse<WeatherData[]>> {
    const params = new HttpParams().set('stationId', stationId);

    return this.apiService.get(`${this.backendEndpoint}/weatherData/current`, params);
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
}
