import {
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

@Component({
  selector: 'app-dashboard',
  imports: [
    ButtonModule,
    CardModule,
    NgxEchartsDirective,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnDestroy {
  isLoading = true;
  isTodaysWeatherDataLoading = true;
  hasError = false;
  todaysWeatherDataHasError = false;
  weatherData: WeatherData[];
  todaysWeatherData: WeatherData[];
  private subscription: Subscription | undefined;
  tempFormat: "f" | "c" = "f";
  formattedTemp: string;
  windSpeedOptions: any = R.clone(windSpeedChartConfig);
  todaysWindSpeedOptions: any = R.clone(windSpeedChartConfig);


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
                this.modifyWindSpeedChartOptions();
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
            this.modifyWindSpeedChartOptions();
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
  }

  modifyWindSpeedChartOptions(): void {
    this.windSpeedOptions = {
      ...this.windSpeedOptions,
      xAxis: {
        ...this.windSpeedOptions.xAxis,
        data: this.weatherData.map(data => {
          const date = new Date(data.timestamp * 1000);
          return this.datePipe.transform(date, 'h:mm a') ?? '';
        }),
      },
      series: [
        {
          ...this.windSpeedOptions.series[0],
          data: this.weatherData.map(data => data.windSpeed),
        }
      ]
    };
  }

  formatTemp(temp: number): string {
    if (this.tempFormat === 'f') {
      return this.formatToF(temp);
    } else {
      return this.formatToC(temp);
    }
  }

  formatToF(temp: number): string {
    return (temp * (9/5) + 32).toFixed(2) + ' °F';
  }

  formatToC(temp: number): string {
    return temp.toFixed(2) + ' °C';
  }

  protected readonly windSpeedChartConfig = windSpeedChartConfig;
}
