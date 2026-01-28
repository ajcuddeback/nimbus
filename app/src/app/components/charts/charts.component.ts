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
import {TempLineComponent} from '../dashboard/temp-line/temp-line.component';
import {WindLineComponent} from '../dashboard/wind-line/wind-line.component';
import {HumidityLineComponent} from '../dashboard/humidity-line/humidity-line.component';
import {CompassComponent} from '../dashboard/compass/compass.component';
import {RainfallLineComponent} from '../dashboard/rainfall-line/rainfall-line.component';
import {PressureLineComponent} from '../dashboard/pressure-line/pressure-line.component';
import {SkeletonModule} from 'primeng/skeleton';
import {SelectButtonModule} from 'primeng/selectbutton';
import {FormsModule} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {TabsModule} from 'primeng/tabs';
import {ApiResponse} from '../../models/api.interface';

@Component({
  selector: 'app-charts',
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
    NgTemplateOutlet,
    SelectButtonModule,
    FormsModule,
    RouterLink,
    TabsModule
  ],
  templateUrl: './charts.component.html',
  styleUrl: './charts.component.scss'
})
export class ChartsComponent implements OnInit {
  isLoading = true;
  hasError = false;
  weatherData$: Observable<{current: ApiResponse<WeatherData[]>, today: ApiResponse<WeatherData[]>}>;
  tempFormat: "f" | "c" = "f";
  isBrowser: boolean;
  activeTab: string = 'current';

  tempOptions = [
    { label: '°F', value: 'f' },
    { label: '°C', value: 'c' }
  ];

  timeRangeOptions = [
    { label: 'Current', value: 'current' },
    { label: 'Today', value: 'today' }
  ];

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
              today: this.weatherDataService.getTodaysWeatherData("80bb40b5fce97afec61866080fa08e01")
            })
          }),
          tap(({current, today}) => {
            if (current.state === 'success' && current.data) {
              this.hasError = false;
              this.isLoading = false;
            }

            if (today.state === 'success' && !today.data) {
              today.data = [];
            }

            return {current, today};
          }),
          shareReplay({ bufferSize: 1, refCount: true })
        );
        this.cdRef.markForCheck();
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

  getLatestWindDirection(weatherData: WeatherData[]): number {
    if (!weatherData || weatherData.length === 0) {
      return 0;
    }
    return weatherData[weatherData.length - 1].windDirection;
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

  formatTemp(temp: number): string {
    if (this.tempFormat === 'f') {
      return (temp * (9/5) + 32).toFixed(1) + '°F';
    } else {
      return temp.toFixed(1) + '°C';
    }
  }

  getCurrentTemp(weatherData: WeatherData[]): string {
    if (!weatherData || weatherData.length === 0) {
      return '--';
    }
    return this.formatTemp(weatherData[weatherData.length - 1].temp);
  }

  getCurrentHumidity(weatherData: WeatherData[]): string {
    if (!weatherData || weatherData.length === 0) {
      return '--';
    }
    return weatherData[weatherData.length - 1].hum + '%';
  }

  getCurrentPressure(weatherData: WeatherData[]): string {
    if (!weatherData || weatherData.length === 0) {
      return '--';
    }
    return this.convertPressureToInches(weatherData[weatherData.length - 1].pr) + ' in';
  }

  getCurrentWindSpeed(weatherData: WeatherData[]): string {
    if (!weatherData || weatherData.length === 0) {
      return '--';
    }
    return weatherData[weatherData.length - 1].windSpeed + ' mph';
  }

  getRainTotal(weatherData: WeatherData[]): string {
    if (!weatherData || weatherData.length === 0) {
      return '0';
    }
    return (Math.round(weatherData.reduce((acc, cur) => acc + (cur.rainfall / 25.4), 0) * 100) / 100).toString();
  }
}
