import {Component, Inject, OnDestroy, OnInit, PLATFORM_ID} from '@angular/core';
import {WeatherDataService} from '../../services/weather-data.service';
import {WeatherData} from '../../models/weather-data.interface';
import {isPlatformBrowser, JsonPipe} from '@angular/common';
import {interval, Subscription, switchMap} from 'rxjs';

@Component({
  selector: 'app-dashboard',
  imports: [
    JsonPipe
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  isLoading = true;
  hasError = false;
  weatherData: WeatherData | undefined;
  private subscription: Subscription | undefined;

  constructor(
    private weatherDataService: WeatherDataService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.subscription = interval(1000).pipe(switchMap(() => this.weatherDataService.getCurrentWeatherData("80bb40b5fce97afec61866080fa08e01")))
        .subscribe({
          next: data => {
            console.log('Hello: ', data);
            this.isLoading = false;
            this.hasError = false;
            this.weatherData = data;
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
      },
      error: error => {
        this.isLoading = false;
        this.hasError = true;
        console.error(error);
      }
    })
  }
}
