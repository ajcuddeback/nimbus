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
import {DatePipe, isPlatformBrowser} from '@angular/common';
import {first, Subscription, switchMap, timer} from 'rxjs';
import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';
import {NgxEchartsDirective} from 'ngx-echarts';
import {windSpeedChartConfig} from './chart-configs/wind-speed-chart.config';
import * as R from 'remeda';
import {tempChartConfigC, tempChartConfigF} from './chart-configs/temp-chart.config';
import {TempLineComponent} from './temp-line/temp-line.component';
import {WindLineComponent} from './wind-line/wind-line.component';
import {HumidityLineComponent} from './humidity-line/humidity-line.component';

@Component({
  selector: 'app-dashboard',
  imports: [
    ButtonModule,
    CardModule,
    TempLineComponent,
    WindLineComponent,
    HumidityLineComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnDestroy, AfterViewInit {
  isLoading = true;
  isTodaysWeatherDataLoading = true;
  hasError = false;
  todaysWeatherDataHasError = false;
  weatherData: WeatherData[];
  todaysWeatherData: WeatherData[];
  private subscription: Subscription | undefined;
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
    if (isPlatformBrowser(this.platformId)) {
      this.applicationRef.isStable.pipe(first((isStable) => isStable)).subscribe(() => {
        this.subscription = timer(0, 60000).pipe(switchMap(() => this.weatherDataService.getCurrentWeatherData("80bb40b5fce97afec61866080fa08e01")))
          .subscribe({
            next: data => {
              this.ngZone.run(() => {
                this.isLoading = false;
                this.hasError = false;
                this.weatherData = data;
                this.formattedTemp = this.formatTemp(this.weatherData[this.weatherData.length - 1].temp);
                this.cdRef.markForCheck();
              });
            },
            error: error => {
              this.ngZone.run(() => {
                this.isLoading = false;
                this.hasError = true;
                console.error(error);
                this.cdRef.markForCheck();
              });
            }
          });

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

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
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

  gatherHumidity(weatherData: WeatherData[]): number[] {
    return weatherData.map(data => data.hum);
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
