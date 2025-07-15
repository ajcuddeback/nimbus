import { Injectable } from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Pageable} from '../models/pageable.interface';
import {WeatherStation} from '../models/weather-stations.interface';
import {environment} from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WeatherStationsService {
  backendEndpoint: string;

  constructor(
    private http: HttpClient,
  ) {
    this.backendEndpoint = environment.WEATHER_API_ENDPOINT;
  }


  getWeatherData(lon: number, lat: number, maxDistance: string): Observable<Pageable<WeatherStation>> {
    const options = {
      params: new HttpParams().set('lon', lon).set('lat', lat).set('maxDistance', maxDistance)
    }
    return this.http.get<Pageable<WeatherStation>>(this.backendEndpoint + '/weatherStations', options);
  }
}
