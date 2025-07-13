import { TestBed } from '@angular/core/testing';

import { WeatherDataService } from './weather-data.service';
import {WeatherData} from '../models/weather-data.interface';
import {Pageable} from '../models/pageable.interface';
import {provideHttpClient, withInterceptorsFromDi} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';

describe('WeatherDataService', () => {
  let service: WeatherDataService;
  let httpMock: HttpTestingController;
  const mockWeatherData: Pageable<WeatherData> = {
    content: [
      {
        temp: 22.44,
        tempFormat: "C",
        hum: 48.28,
        pr: 1012.93,
        prFormat: "hPa",
        timestamp: 1750118062,
        stationId: "6850aeae41635463bfa36a91",
        id: "6850aeae41635463bfa36a91",
        windDirection: "N",
        windSpeed: 20,
        windSpeedFormat: "mph",
        rainfall: 20,
        rainfallFormat: "mm"
      }
    ],
    pageable: {
      pageNumber: 0,
      pageSize: 1,
      sort: {
        empty: false,
        sorted: true,
        unsorted: false
      },
      offset: 0,
      unpaged: false,
      paged: true,
    },
    totalPages: 30,
    totalElements: 30,
    last: false,
    size: 1,
    number: 0,
    sort: {
      empty: false,
      sorted: true,
      unsorted: false
    },
    first: true,
    numberOfElements: 1,
    empty: false
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(WeatherDataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  })

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get weather data', () => {
    const expectedUrl = 'http://localhost:8080/weatherData';
    service.backendEndpoint = 'http://localhost:8080';

    service.getWeatherData(-81, 21, 'timestamp,desc', 0, 1).subscribe((data) => {
      expect(data).toEqual(mockWeatherData);
    });

    const req = httpMock.expectOne(expectedUrl);
    expect(req.request.method).toBe('GET');

    req.flush(mockWeatherData);
  });
});
