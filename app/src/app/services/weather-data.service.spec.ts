import { TestBed } from '@angular/core/testing';

import { WeatherDataService } from './weather-data.service';
import { WeatherData } from '../models/weather-data.interface';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../environments/environment';

describe('WeatherDataService', () => {
  let service: WeatherDataService;
  let httpMock: HttpTestingController;

  const stationId = 'test-station-id';
  const mockWeatherData: WeatherData[] = [
    {
      temp: 22.44,
      tempFormat: 'C',
      hum: 48.28,
      pr: 1012.93,
      prFormat: 'hPa',
      timestamp: 1750118062,
      stationId,
      id: '6850aeae41635463bfa36a91',
      windDirection: 0,
      windSpeed: 20,
      windSpeedFormat: 'mph',
      rainfall: 20,
      rainfallFormat: 'mm'
    }
  ];

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
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get current weather data for a station', () => {
    const received: unknown[] = [];

    service.getCurrentWeatherData(stationId).subscribe(response => received.push(response));

    const request = httpMock.expectOne(
      `${environment.WEATHER_API_ENDPOINT}/weatherData/current?stationId=${stationId}`
    );
    expect(request.request.method).toBe('GET');
    request.flush(mockWeatherData);

    expect(received).toEqual([
      { state: 'loading' },
      { state: 'success', data: mockWeatherData }
    ]);
  });

  it('should report an error state when the request fails', () => {
    const received: unknown[] = [];

    service.getCurrentWeatherData(stationId).subscribe(response => received.push(response));

    const request = httpMock.expectOne(
      `${environment.WEATHER_API_ENDPOINT}/weatherData/current?stationId=${stationId}`
    );
    request.flush('boom', { status: 500, statusText: 'Server Error' });

    expect(received.length).toBe(2);
    expect(received[0]).toEqual({ state: 'loading' });
    expect((received[1] as { state: string }).state).toBe('error');
  });
});
