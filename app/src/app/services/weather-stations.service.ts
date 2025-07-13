import { Injectable } from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Pageable} from '../models/pageable.interface';
import {WeatherStation} from '../models/weather-stations.interface';

@Injectable({
  providedIn: 'root'
})
export class WeatherStationsService {
  backendEndpoint: string;

  constructor(
    private http: HttpClient,
  ) {
    this.backendEndpoint = import.meta.env.WEATHER_API_ENDPOINT ? import.meta.env.WEATHER_API_ENDPOINT : 'http://localhost:8080';
  }


  getWeatherData(lon: number, lat: number, maxDistance: string): Observable<Pageable<WeatherStation>> {
    const options = {
      params: new HttpParams().set('lon', lon).set('lat', lat).set('maxDistance', maxDistance)
    }
    return this.http.get<Pageable<WeatherStation>>(this.backendEndpoint + '/weatherStations', options);
  }
}
