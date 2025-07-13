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
    // TODO: This must come from some kind of config.. Probably not hard coded..
    this.backendEndpoint ='http://localhost:8080';
  }


  getWeatherData(lon: number, lat: number, maxDistance: string): Observable<Pageable<WeatherStation>> {
    const options = {
      params: new HttpParams().set('lon', lon).set('lat', lat).set('maxDistance', maxDistance)
    }
    return this.http.get<Pageable<WeatherStation>>(this.backendEndpoint + '/weatherStations', options);
  }
}
