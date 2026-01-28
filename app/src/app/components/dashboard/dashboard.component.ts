import {
  ChangeDetectorRef,
  Component,
  Inject, OnInit,
  PLATFORM_ID
} from '@angular/core';
import {WeatherDataService} from '../../services/weather-data.service';
import {WeatherData} from '../../models/weather-data.interface';
import {AsyncPipe, DatePipe, isPlatformBrowser, NgTemplateOutlet} from '@angular/common';
import {
  forkJoin,
  Observable,
  shareReplay,
  switchMap,
  tap,
  timer
} from 'rxjs';
import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';
import {SkeletonModule} from 'primeng/skeleton';
import {SelectButtonModule} from 'primeng/selectbutton';
import {FormsModule} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {ApiResponse} from '../../models/api.interface';

interface HourlyForecast {
  time: string;
  temp: number;
  humidity: number;
}

@Component({
  selector: 'app-dashboard',
  imports: [
    ButtonModule,
    CardModule,
    AsyncPipe,
    SkeletonModule,
    NgTemplateOutlet,
    SelectButtonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  isLoading = true;
  hasError = false;
  weatherData$: Observable<{current: ApiResponse<WeatherData[]>, today: ApiResponse<WeatherData[]>, summary: ApiResponse<{ summary: string }>}>;
  tempFormat: "f" | "c" = "f";
  formattedTemp: string;
  isBrowser: boolean;

  tempOptions = [
    { label: '°F', value: 'f' },
    { label: '°C', value: 'c' }
  ];

  private latestTemp: number = 0;

  constructor(
    private weatherDataService: WeatherDataService,
    private cdRef: ChangeDetectorRef,
    private datePipe: DatePipe,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
        this.weatherData$ = timer(0, 60000).pipe(
          switchMap(() => {
            return forkJoin({
              current: this.weatherDataService.getCurrentWeatherData("80bb40b5fce97afec61866080fa08e01"),
              today: this.weatherDataService.getTodaysWeatherData("80bb40b5fce97afec61866080fa08e01"),
              summary: this.weatherDataService.getAISummary("80bb40b5fce97afec61866080fa08e01")
            })
          }),
          tap(({current, today, summary}) => {
            if (current.state === 'success' && current.data) {
              if (current.data[current.data.length - 1]?.temp) {
                this.latestTemp = current.data[current.data.length - 1].temp;
                this.formattedTemp = this.formatTemp(this.latestTemp);
              }
              this.hasError = false;
              this.isLoading = true;
            }

            if (today.state === 'success' && !today.data) {
              today.data = [];
            }

            return {current, today, summary};
          }),
          shareReplay({ bufferSize: 1, refCount: true })
        );
        this.cdRef.markForCheck();
    }
  }

  onTempFormatChange(): void {
    if (this.latestTemp) {
      this.formattedTemp = this.formatTemp(this.latestTemp);
    }
  }

  formatTemp(temp: number): string {
    if (this.tempFormat === 'f') {
      return this.formatToF(temp);
    } else {
      return this.formatToC(temp);
    }
  }

  getPeakTemp(weatherData: WeatherData[]): string {
    if (!weatherData || weatherData.length === 0) {
      return '--';
    }
    const peak = Math.max(...weatherData.map(data => data.temp));
    if (peak === Number.NEGATIVE_INFINITY || peak === Number.POSITIVE_INFINITY) {
      return '--';
    }
    return this.formatTemp(peak);
  }

  getMinTemp(weatherData: WeatherData[]): string {
    if (!weatherData || weatherData.length === 0) {
      return '--';
    }
    const min = Math.min(...weatherData.map(data => data.temp));
    if (min === Number.NEGATIVE_INFINITY || min === Number.POSITIVE_INFINITY) {
      return '--';
    }
    return this.formatTemp(min);
  }

  getPeakHumidity(weatherData: WeatherData[]): string {
    if (!weatherData || weatherData.length === 0) {
      return '--';
    }
    const peak = Math.max(...weatherData.map(data => data.hum));
    if (peak === Number.NEGATIVE_INFINITY || peak === Number.POSITIVE_INFINITY) {
      return '--';
    }
    return peak + '%';
  }

  getMaxWindSpeed(weatherData: WeatherData[]): number {
    if (!weatherData || weatherData.length === 0) {
      return 0;
    }
    const max = Math.max(...weatherData.map(data => data.windSpeed));
    if (max === Number.NEGATIVE_INFINITY || max === Number.POSITIVE_INFINITY) {
      return 0;
    }
    return Math.round(max * 10) / 10;
  }

  getWindDirectionLabel(degrees: number): string {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  }

  getHourlyForecast(weatherData: WeatherData[]): HourlyForecast[] {
    if (!weatherData || weatherData.length === 0) {
      return [];
    }

    // Sample data at roughly hourly intervals (take every ~12th reading assuming 5-min intervals)
    const hourlyData: HourlyForecast[] = [];
    const interval = Math.max(1, Math.floor(weatherData.length / 12));

    for (let i = 0; i < weatherData.length && hourlyData.length < 12; i += interval) {
      const data = weatherData[i];
      const date = new Date(data.timestamp * 1000);
      hourlyData.push({
        time: this.datePipe.transform(date, 'h a') ?? '',
        temp: data.temp,
        humidity: data.hum
      });
    }

    return hourlyData;
  }

  calculateFeelsLikeTemp(tempC: number, humidity: number, windMph: number) {
    const windKph = windMph * 1.609;
    const tempF = (tempC * 9) / 5 + 32;

    if (tempC >= 27 && humidity >= 40) {
      const HI = -42.379 +
        2.04901523 * tempF +
        10.14333127 * humidity -
        0.22475541 * tempF * humidity -
        0.00683783 * tempF ** 2 -
        0.05481717 * humidity ** 2 +
        0.00122874 * tempF ** 2 * humidity +
        0.00085282 * tempF * humidity ** 2 -
        0.00000199 * tempF ** 2 * humidity ** 2;

      const feelsLikeC = (HI - 32) * 5 / 9;
      return Math.round(feelsLikeC * 10) / 10;
    }

    if (tempC <= 10 && windKph > 4.8) {
      const V = windKph;
      const T_wc = 13.12 +
        0.6215 * tempC -
        11.37 * Math.pow(V, 0.16) +
        0.3965 * tempC * Math.pow(V, 0.16);
      return Math.round(T_wc * 10) / 10;
    }

    return Math.round(tempC * 10) / 10;
  }

  convertPressureToInches(pressure: number): number {
    return +(pressure * 0.02953).toFixed(2)
  }

  getRainTotal(weatherData: WeatherData[]): number {
    if (!weatherData || weatherData.length === 0) {
      return 0;
    }
    return Math.round(weatherData.reduce((accumulator, currentValue) => accumulator + (currentValue.rainfall / 25.4), 0) * 100) / 100;
  }

  formatToF(temp: number): string {
    return (temp * (9/5) + 32).toFixed(0) + '°F';
  }

  formatToC(temp: number): string {
    return temp.toFixed(0) + '°C';
  }
}
