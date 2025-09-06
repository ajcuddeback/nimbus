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
  catchError,
  forkJoin,
  Observable,
  of, shareReplay,
  switchMap,
  tap,
  timer
} from 'rxjs';
import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';
import {windSpeedChartConfig} from './chart-configs/wind-speed-chart.config';
import {TempLineComponent} from './temp-line/temp-line.component';
import {WindLineComponent} from './wind-line/wind-line.component';
import {HumidityLineComponent} from './humidity-line/humidity-line.component';
import {CompassComponent} from './compass/compass.component';
import {RainfallLineComponent} from './rainfall-line/rainfall-line.component';
import {PressureLineComponent} from './pressure-line/pressure-line.component';
import {SkeletonModule} from 'primeng/skeleton';

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
  isLoading = true;
  isTodaysWeatherDataLoading = true;
  hasError = false;
  todaysWeatherDataHasError = false;
  weatherData$: Observable<{current: WeatherData[], today: WeatherData[], summary: { summary: string }}>;
  tempFormat: "f" | "c" = "f";
  formattedTemp: string;
  isBrowser: boolean;

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
              current: this.weatherDataService.getCurrentWeatherData("80bb40b5fce97afec61866080fa08e01")
                .pipe(
                  catchError(error => {
                    console.error(error);
                    this.hasError = true;
                    this.isLoading = false;
                    return of([]);
                  }),
                ),
              today: this.weatherDataService.getTodaysWeatherData("80bb40b5fce97afec61866080fa08e01").pipe(
                tap(() => {
                  this.todaysWeatherDataHasError = false;
                  this.isTodaysWeatherDataLoading = false;
                }),
                catchError(error => {
                  console.error(error);
                  this.todaysWeatherDataHasError = true;
                  this.isTodaysWeatherDataLoading = false;
                  return of([]);
                }),
              ),
              summary: this.weatherDataService.getAISummary("80bb40b5fce97afec61866080fa08e01").pipe(
                catchError(error => {
                  console.error(error);
                  return of({summary: "Could not retrieve AI Summary!"});
                }),
              ),
            })
          }),
          tap(({current, today, summary}) => {
            if (current) {
              if (current[current.length - 1]?.temp) {
                this.formattedTemp = this.formatTemp(current[current.length - 1].temp);
              }
              this.hasError = false;
              this.isLoading = true;
            } else {
              current = [];
            }

            if (!today) {
              today = [];
            }

            return {current, today, summary};
          }),
          shareReplay({ bufferSize: 1, refCount: true })
        );
        // Detect changes after initial assignment - as we are using onPush
        this.cdRef.markForCheck();
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
    return this.formatTemp(Math.max(...weatherData.map(data => data.temp)));
  }

  getPeakHumidity(weatherData: WeatherData[]): string {
    return Math.max(...weatherData.map(data => data.hum)) + '%';
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

  gatherTimestamps(weatherData: WeatherData[]): string[] {
    return weatherData.map(data => {
      const date = new Date(data.timestamp * 1000);
      return this.datePipe.transform(date, 'h:mm a') ?? '';
    })
  }

  gatherWindSpeeds(weatherData: WeatherData[]): number[] {
    return weatherData.map(data => data.windSpeed);
  }

  gatherTemps(weatherData: WeatherData[]): number[] {
    return weatherData.map(data => data.temp);
  }

  gatherRainfall(weatherData: WeatherData[]): number[] {
    return weatherData.map(data => Math.round((data.rainfall / 25.4) * 100) / 100);
  }

  gatherPressures(weatherData: WeatherData[]): number[] {
    return weatherData.map(data => this.convertPressureToInches(data.pr));
  }

  gatherHumidity(weatherData: WeatherData[]): number[] {
    return weatherData.map(data => data.hum);
  }

  convertPressureToInches(pressure: number): number {
    return +(pressure * 0.02953).toFixed(2)
  }

  getRainTotal(weatherData: WeatherData[]): number {
    return Math.round(weatherData.reduce((accumulator, currentValue) => accumulator + (currentValue.rainfall / 25.4), 0) * 100) / 100;
  }

  formatToF(temp: number): string {
    return (temp * (9/5) + 32).toFixed(2) + ' °F';
  }

  formatToC(temp: number): string {
    return temp.toFixed(2) + ' °C';
  }

  protected readonly windSpeedChartConfig = windSpeedChartConfig;

}
