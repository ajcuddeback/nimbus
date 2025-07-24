import { Injectable } from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {WeatherData} from '../models/weather-data.interface';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WeatherDataService {
  backendEndpoint: string;

  constructor(
    private http: HttpClient,
  ) {
    this.backendEndpoint = environment.WEATHER_API_ENDPOINT;
  }

  getCurrentWeatherData(stationId: string): Observable<WeatherData[]> {
    const options = {
      params: new HttpParams().set('stationId', stationId)
    }
    return this.http.get<WeatherData[]>(`${this.backendEndpoint}/weatherData/current`, options);
  }
}
