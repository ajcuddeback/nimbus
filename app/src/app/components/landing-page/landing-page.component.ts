import { Component, OnInit } from '@angular/core';
import { AsyncPipe, NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SkeletonModule } from 'primeng/skeleton';
import { CombinedWeatherData, WeatherDataService } from '../../services/weather-data.service';
import { WeatherUtilsService } from '../../services/weather-utils.service';
import { WeatherData } from '../../models/weather-data.interface';

@Component({
  selector: 'app-landing-page',
  imports: [
    AsyncPipe,
    NgTemplateOutlet,
    ButtonModule,
    CardModule,
    SkeletonModule,
    RouterLink
  ],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss'
})
export class LandingPageComponent implements OnInit {
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

  formatTempShort(temp: number): string {
    return this.weatherUtils.formatTempShort(temp, this.tempFormat);
  }

  calculateFeelsLikeTemp(tempC: number, humidity: number, windMph: number): number {
    return this.weatherUtils.calculateFeelsLikeTemp(tempC, humidity, windMph);
  }

  getPeakTemp(weatherData: WeatherData[]): string {
    if (!weatherData || weatherData.length === 0) return '--';
    const peak = Math.max(...weatherData.map(d => d.temp));
    if (!isFinite(peak)) return '--';
    return this.weatherUtils.formatTempShort(peak, this.tempFormat);
  }

  getMinTemp(weatherData: WeatherData[]): string {
    if (!weatherData || weatherData.length === 0) return '--';
    const min = Math.min(...weatherData.map(d => d.temp));
    if (!isFinite(min)) return '--';
    return this.weatherUtils.formatTempShort(min, this.tempFormat);
  }

  convertPressureToInches(pressure: number): number {
    return this.weatherUtils.convertPressureToInches(pressure);
  }

  getWindDirectionLabel(degrees: number): string {
    return this.weatherUtils.getWindDirectionLabel(degrees);
  }

  getRainTotal(weatherData: WeatherData[]): number {
    return this.weatherUtils.getRainTotal(weatherData);
  }

  toggleTempFormat(): void {
    this.tempFormat = this.tempFormat === 'f' ? 'c' : 'f';
  }
}
