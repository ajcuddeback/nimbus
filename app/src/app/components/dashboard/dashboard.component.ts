import {Component, Inject, OnDestroy, OnInit, PLATFORM_ID} from '@angular/core';
import {WeatherDataService} from '../../services/weather-data.service';
import {WeatherData} from '../../models/weather-data.interface';
import {isPlatformBrowser} from '@angular/common';
import {Subscription, switchMap, timer} from 'rxjs';
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
export class DashboardComponent implements OnDestroy {
  isLoading = true;
  hasError = false;
  weatherData: WeatherData[];
  private subscription: Subscription | undefined;
  tempFormat: "f" | "c" = "f";
  formattedTemp: string;

  constructor(
    private weatherDataService: WeatherDataService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.subscription = timer(0, 60000).pipe(switchMap(() => this.weatherDataService.getCurrentWeatherData("80bb40b5fce97afec61866080fa08e01")))
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

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
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
    this.formattedTemp = (this.weatherData[this.weatherData.length - 1].temp * (9/5) + 32).toFixed(2) + ' °F';
  }

  formatToC() {
    this.formattedTemp = this.weatherData[this.weatherData.length - 1].temp.toFixed(2) + ' °C';
  }
}
