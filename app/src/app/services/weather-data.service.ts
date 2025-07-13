import { Injectable } from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {WeatherData} from '../models/weather-data.interface';

@Injectable({
  providedIn: 'root'
})
export class WeatherDataService {
  backendEndpoint: string;

  constructor(
    private http: HttpClient,
  ) {
    this.backendEndpoint = import.meta.env.WEATHER_API_ENDPOINT ? import.meta.env.WEATHER_API_ENDPOINT : 'http://localhost:8080';
  }

  getCurrentWeatherData(stationId: string): Observable<WeatherData> {
    const options = {
      params: new HttpParams().set('stationId', stationId)
    }
    return this.http.get<WeatherData>(`${this.backendEndpoint}/weatherData/current`, options);
  }
}
