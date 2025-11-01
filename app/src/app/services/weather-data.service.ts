import { Injectable } from '@angular/core';
import {HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {WeatherData} from '../models/weather-data.interface';
import { environment } from '../../environments/environment';
import {ApiService} from './api.service';
import {ApiResponse} from '../models/api.interface';

@Injectable({
  providedIn: 'root'
})
export class WeatherDataService {
  backendEndpoint: string;

  constructor(
    private apiService: ApiService
  ) {
    this.backendEndpoint = environment.WEATHER_API_ENDPOINT;
  }

  getCurrentWeatherData(stationId: string): Observable<ApiResponse<WeatherData[]>> {
    const params = new HttpParams().set('stationId', stationId)

    return this.apiService.get(`${this.backendEndpoint}/weatherData/current`, params)
  }

  getTodaysWeatherData(stationId: string): Observable<ApiResponse<WeatherData[]>> {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const params = new HttpParams().set('stationId', stationId).set('timezone', timeZone)

    return this.apiService.get(`${this.backendEndpoint}/weatherData/today`, params);
  }

  getAISummary(stationId: string): Observable<ApiResponse<{ summary: string }>> {
    const params = new HttpParams().set('stationId', stationId)

    return this.apiService.get(`${this.backendEndpoint}/weatherSummary`, params);
  }
}
