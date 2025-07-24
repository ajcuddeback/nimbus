import {
  ApplicationRef,
  ChangeDetectorRef,
  Component,
  inject,
  Inject,
  NgZone,
  OnDestroy,
  OnInit,
  PLATFORM_ID
} from '@angular/core';
import {WeatherDataService} from '../../services/weather-data.service';
import {WeatherData} from '../../models/weather-data.interface';
import {isPlatformBrowser} from '@angular/common';
import {first, Subscription, switchMap, timer} from 'rxjs';
import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';
import {NgxEchartsDirective} from 'ngx-echarts';

@Component({
  selector: 'app-dashboard',
  imports: [
    ButtonModule,
    CardModule,
    NgxEchartsDirective
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
  options: any =  {
    legend: {
      align: 'left'
    },
    xAxis: {
      type: 'category',
      data: []
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        data: [],
        type: 'line'
      }
    ]
  };

  constructor(
    private weatherDataService: WeatherDataService,
    private ngZone: NgZone,
    private cdRef: ChangeDetectorRef,
    private applicationRef: ApplicationRef,
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
                this.formatTemp();
                this.modifyChartOptions();
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
      })
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

  modifyChartOptions(): void {
    this.options = {
      ...this.options,
      xAxis: {
        ...this.options.xAxis,
        data: this.weatherData.map(data => data.timestamp),
      },
      series: [
        {
          ...this.options.series[0],
          data: this.weatherData.map(data => data.temp),
        }
      ]
    };
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
