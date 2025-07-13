import {Component, Inject, OnDestroy, OnInit, PLATFORM_ID} from '@angular/core';
import {WeatherDataService} from '../../services/weather-data.service';
import {WeatherData} from '../../models/weather-data.interface';
import {isPlatformBrowser, JsonPipe} from '@angular/common';
import {interval, Subscription, switchMap} from 'rxjs';
import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';

@Component({
  selector: 'app-dashboard',
  imports: [
    ButtonModule,
    CardModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  isLoading = true;
  hasError = false;
  weatherData: WeatherData;
  private subscription: Subscription | undefined;
  tempFormat: "f" | "c" = "c";
  formattedTemp: string;

  constructor(
    private weatherDataService: WeatherDataService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.subscription = interval(1000).pipe(switchMap(() => this.weatherDataService.getCurrentWeatherData("80bb40b5fce97afec61866080fa08e01")))
        .subscribe({
          next: data => {
            this.isLoading = false;
            this.hasError = false;
            this.weatherData = data;
            this.formatTemp();
          },
          error: error => {
            this.isLoading = false;
            this.hasError = true;
            console.error(error);
          }
        });
    }
  }

  ngOnInit(): void {
    this.getWeatherData();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  getWeatherData() {
    this.weatherDataService.getCurrentWeatherData("80bb40b5fce97afec61866080fa08e01").subscribe({
      next: data => {
        this.isLoading = false;
        this.hasError = false;
        this.weatherData = data;
        this.formatTemp();
      },
      error: error => {
        this.isLoading = false;
        this.hasError = true;
        console.error(error);
      }
    })
  }

  onTempFormatChange() {
    if (this.tempFormat === 'f') {
      this.tempFormat = 'c';
      this.formatToC();
    } else {
      this.tempFormat = 'f';
      this.formatToF();
    }
  }

  formatTemp(){
    if (this.tempFormat === 'f') {
      this.formatToF();
    } else {
      this.formatToC();
    }
  }

  formatToF() {
    this.formattedTemp = (this.weatherData.temp * (9/5) + 32).toFixed(2) + ' °F';
  }

  formatToC() {
    this.formattedTemp = this.weatherData.temp.toFixed(2) + ' °C';
  }
}
