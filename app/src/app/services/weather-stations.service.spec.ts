import { TestBed } from '@angular/core/testing';

import { WeatherStationsService } from './weather-stations.service';

describe('WeatherStationsService', () => {
  let service: WeatherStationsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WeatherStationsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
