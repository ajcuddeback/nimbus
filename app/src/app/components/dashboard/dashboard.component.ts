import { Component, OnInit } from '@angular/core';
import { CombinedWeatherData, WeatherDataService } from '../../services/weather-data.service';
import { WeatherUtilsService } from '../../services/weather-utils.service';
import { WeatherData } from '../../models/weather-data.interface';
import { AsyncPipe, NgTemplateOutlet } from '@angular/common';
import { Observable } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { windSpeedChartConfig } from './chart-configs/wind-speed-chart.config';
import { TempLineComponent } from './temp-line/temp-line.component';
import { WindLineComponent } from './wind-line/wind-line.component';
import { HumidityLineComponent } from './humidity-line/humidity-line.component';
import { CompassComponent } from './compass/compass.component';
import { RainfallLineComponent } from './rainfall-line/rainfall-line.component';
import { PressureLineComponent } from './pressure-line/pressure-line.component';
import { SkeletonModule } from 'primeng/skeleton';

// Run with  ng serve --host 127.0.0.1

@Component({
  selector: 'app-dashboard',
  imports: [
    ButtonModule,
    CardModule,
    TempLineComponent,
    WindLineComponent,
    HumidityLineComponent,
    CompassComponent,
    RainfallLineComponent,
    PressureLineComponent,
    AsyncPipe,
    SkeletonModule,
    NgTemplateOutlet
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  weatherData$: Observable<CombinedWeatherData>;
  tempFormat: 'f' | 'c' = 'f';

  constructor(
    private weatherDataService: WeatherDataService,
    private weatherUtils: WeatherUtilsService
  ) {}

  ngOnInit() {
    this.weatherData$ = this.weatherDataService.getCombinedWeatherData('80bb40b5fce97afec61866080fa08e01');
  }

  formatTemp(temp: number): string {
    return this.weatherUtils.formatTemp(temp, this.tempFormat);
  }

  getPeakTemp(weatherData: WeatherData[]): string {
    return this.weatherUtils.getPeakTemp(weatherData, this.tempFormat);
  }

  getPeakHumidity(weatherData: WeatherData[]): string {
    return this.weatherUtils.getPeakHumidity(weatherData);
  }

  calculateFeelsLikeTemp(tempC: number, humidity: number, windMph: number): number {
    return this.weatherUtils.calculateFeelsLikeTemp(tempC, humidity, windMph);
  }

  gatherTimestamps(weatherData: WeatherData[]): string[] {
    return this.weatherUtils.gatherTimestamps(weatherData);
  }

  gatherWindSpeeds(weatherData: WeatherData[]): number[] {
    return this.weatherUtils.gatherWindSpeeds(weatherData);
  }

  gatherTemps(weatherData: WeatherData[]): number[] {
    return this.weatherUtils.gatherTemps(weatherData);
  }

  gatherRainfall(weatherData: WeatherData[]): number[] {
    return this.weatherUtils.gatherRainfall(weatherData);
  }

  gatherPressures(weatherData: WeatherData[]): number[] {
    return this.weatherUtils.gatherPressures(weatherData);
  }

  gatherHumidity(weatherData: WeatherData[]): number[] {
    return this.weatherUtils.gatherHumidity(weatherData);
  }

  convertPressureToInches(pressure: number): number {
    return this.weatherUtils.convertPressureToInches(pressure);
  }

  getRainTotal(weatherData: WeatherData[]): number {
    return this.weatherUtils.getRainTotal(weatherData);
  }

  protected readonly windSpeedChartConfig = windSpeedChartConfig;
}
