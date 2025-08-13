import {
  AfterViewInit,
  ApplicationRef,
  ChangeDetectorRef,
  Component,
  Inject,
  NgZone,
  OnDestroy,
  PLATFORM_ID
} from '@angular/core';
import {WeatherDataService} from '../../services/weather-data.service';
import {WeatherData} from '../../models/weather-data.interface';
import {AsyncPipe, DatePipe, isPlatformBrowser} from '@angular/common';
import {
  catchError,
  combineLatest,
  finalize,
  first,
  map,
  Observable,
  of, shareReplay,
  Subscription,
  switchMap,
  tap,
  timer
} from 'rxjs';
import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';
import {NgxEchartsDirective} from 'ngx-echarts';
import {windSpeedChartConfig} from './chart-configs/wind-speed-chart.config';
import * as R from 'remeda';
import {tempChartConfigC, tempChartConfigF} from './chart-configs/temp-chart.config';
import {TempLineComponent} from './temp-line/temp-line.component';
import {WindLineComponent} from './wind-line/wind-line.component';
import {HumidityLineComponent} from './humidity-line/humidity-line.component';
import {CompassComponent} from './compass/compass.component';
import {RainfallLineComponent} from './rainfall-line/rainfall-line.component';
import {PressureLineComponent} from './pressure-line/pressure-line.component';

// RUn with  ng serve --host 127.0.0.1

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
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements AfterViewInit {
  isLoading = true;
  isTodaysWeatherDataLoading = true;
  hasError = false;
  todaysWeatherDataHasError = false;
  weatherData: WeatherData[];
  todaysWeatherData: WeatherData[];
  thisHourWeatherData$: Observable<WeatherData[] | null>;
  tempFormat: "f" | "c" = "f";
  formattedTemp: string;

  constructor(
    private weatherDataService: WeatherDataService,
    private ngZone: NgZone,
    private cdRef: ChangeDetectorRef,
    private applicationRef: ApplicationRef,
    private datePipe: DatePipe,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngAfterViewInit() {
    // TODO: Use a merge map to combine both getCurrentWeatherData and getTodaysWeatherData into one observable.
    // TODO: Ensure to return some form of object, each key having todays and current data in it
    // TODO: Only async pipe to the combined observable. We call both of these every minute anyway! May as well.
    // TODO: To be fair, we should only have to call todays weather once per hour... But I can revisit this.
    // TODO: Maybe use a pipe for temp formatting. Right not, I do it manually based on a switch
    // TODO: But using a pipe could be helpful?
    if (isPlatformBrowser(this.platformId)) {
      this.applicationRef.isStable.pipe(first((isStable) => isStable)).subscribe(() => {
        this.thisHourWeatherData$ = timer(0, 60000).pipe(
          switchMap(() => this.weatherDataService.getCurrentWeatherData("80bb40b5fce97afec61866080fa08e01")),
          tap((data) => {
            if (data[data.length - 1]?.temp) {
              this.formattedTemp = this.formatTemp(data[data.length - 1].temp);
            }
            this.hasError = false;
            this.isLoading = false;
            this.cdRef.markForCheck();
          }),
          catchError(error => {
            console.log(error);
            this.hasError = true;
            this.isLoading = false;
            return of(null);
          }),
          shareReplay({ bufferSize: 1, refCount: true })
        );
        this.getTodaysWeatherData();
      })
    }
  }

  getTodaysWeatherData() {
    timer(0, 60000).pipe(switchMap(() => this.weatherDataService.getTodaysWeatherData("80bb40b5fce97afec61866080fa08e01")))
      .subscribe({
        next: data => {
          this.ngZone.run(() => {
            this.isTodaysWeatherDataLoading = false;
            this.todaysWeatherDataHasError = false;
            this.todaysWeatherData = data;
            this.cdRef.markForCheck();
          });
        },
        error: error => {
          this.ngZone.run(() => {
            this.isTodaysWeatherDataLoading = false;
            this.todaysWeatherDataHasError = true;
            console.error(error);
            this.cdRef.markForCheck();
          });
        }
      });
  }

  onTempFormatChange() {
    if (this.tempFormat === 'f') {
      this.tempFormat = 'c';
    } else {
      this.tempFormat = 'f';
    }
    this.formattedTemp = this.formatTemp(this.weatherData[this.weatherData.length - 1].temp);
    console.log('Going to mark for check!');
    this.cdRef.markForCheck();
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
  formatWindDirection(direction: number): string {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

    const angle = direction % 360;
    const index = Math.floor((angle + 22.5) / 45) % 8;
    return directions[index];
  }

  protected readonly windSpeedChartConfig = windSpeedChartConfig;

}
