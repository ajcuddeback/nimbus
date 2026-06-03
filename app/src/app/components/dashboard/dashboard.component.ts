import { Component, OnInit } from '@angular/core';
import { AsyncPipe, DatePipe, NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { Observable } from 'rxjs';
import { SkeletonModule } from 'primeng/skeleton';
import { CombinedWeatherData, WeatherDataService } from '../../services/weather-data.service';
import { WeatherUtilsService } from '../../services/weather-utils.service';
import { WeatherData } from '../../models/weather-data.interface';
import { AreaChartComponent } from '../shared/area-chart/area-chart.component';
import { SparklineComponent } from '../shared/sparkline/sparkline.component';
import { NimbusCompassComponent } from '../shared/nimbus-compass/nimbus-compass.component';
import { PressureGaugeComponent } from '../shared/pressure-gauge/pressure-gauge.component';

@Component({
  selector: 'app-dashboard',
  imports: [AsyncPipe, NgTemplateOutlet, SkeletonModule, RouterLink,
    AreaChartComponent, SparklineComponent, NimbusCompassComponent, PressureGaugeComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  providers: [DatePipe]
})
export class DashboardComponent implements OnInit {
  weatherData$: Observable<CombinedWeatherData>;
  liveMode = false;

  get isDark(): boolean { return this.theme.isDark; }
  toggleTheme(): void { this.theme.toggle(); }

  constructor(
    private weatherDataService: WeatherDataService,
    private weatherUtils: WeatherUtilsService,
    private datePipe: DatePipe,
    private theme: ThemeService
  ) {}

  ngOnInit(): void {
    this.weatherData$ = this.weatherDataService.getCombinedWeatherData('80bb40b5fce97afec61866080fa08e01');
  }

  setLiveMode(live: boolean): void { this.liveMode = live; }

  private toF(tempC: number): number { return tempC * 9 / 5 + 32; }
  private toInHg(hPa: number): number { return +(hPa * 0.02953).toFixed(3); }
  private toInches(mm: number): number { return +(mm / 25.4).toFixed(3); }

  private label(ts: number): string {
    return this.datePipe.transform(new Date(ts * 1000), 'h:mm a') ?? '';
  }

  private sorted(data: WeatherData[]): WeatherData[] {
    return [...data].sort((a, b) => a.timestamp - b.timestamp);
  }

  getTempValues(data: WeatherData[]): number[] { return this.sorted(data).map(d => +this.toF(d.temp).toFixed(1)); }
  getHumidValues(data: WeatherData[]): number[] { return this.sorted(data).map(d => d.hum); }
  getWindValues(data: WeatherData[]): number[] { return this.sorted(data).map(d => d.windSpeed); }
  getPressureValues(data: WeatherData[]): number[] { return this.sorted(data).map(d => this.toInHg(d.pr)); }

  getRainCumulativeValues(data: WeatherData[]): number[] {
    const s = this.sorted(data);
    let acc = 0;
    return s.map(d => { acc += this.toInches(d.rainfall); return +acc.toFixed(3); });
  }

  getLabels(data: WeatherData[]): string[] { return this.sorted(data).map(d => this.label(d.timestamp)); }

  getLastUpdateTime(latest: WeatherData): string {
    if (!latest?.timestamp) return '';
    return this.datePipe.transform(new Date(latest.timestamp * 1000), 'h:mm a') ?? '';
  }

  getConditionLabel(latest: WeatherData): string {
    const mm = latest?.rainfall ?? 0;
    if (mm > 2) return 'Hot · Storm';
    if (mm > 0.3) return 'Rain';
    const f = this.toF(latest.temp);
    if (f >= 90) return 'Hot · Clear';
    if (f >= 80) return 'Warm · Clear';
    return 'Clear';
  }

  getPressureTrend(today: WeatherData[]): string {
    if (today.length < 4) return '';
    const sorted = this.sorted(today);
    const recent = sorted.slice(-1)[0].pr;
    const earlier = sorted[Math.max(0, sorted.length - 4)].pr;
    const delta = recent - earlier;
    if (delta < -0.5) return '↓ falling';
    if (delta > 0.5) return '↑ rising';
    return '→ steady';
  }

  formatTempShort(tempC: number): string {
    return this.weatherUtils.formatTempShort(tempC, 'f');
  }

  getFeelsLike(tempC: number, hum: number, wind: number): string {
    const f = this.weatherUtils.calculateFeelsLikeTemp(tempC, hum, wind);
    return (f * 9 / 5 + 32).toFixed(1);
  }

  getPeakTemp(today: WeatherData[]): string {
    if (!today?.length) return '--';
    const peak = Math.max(...today.map(d => this.toF(d.temp)));
    return isFinite(peak) ? peak.toFixed(1) : '--';
  }

  getLowTemp(today: WeatherData[]): string {
    if (!today?.length) return '--';
    const low = Math.min(...today.map(d => this.toF(d.temp)));
    return isFinite(low) ? low.toFixed(1) : '--';
  }

  convertPressureToInches(pr: number): number { return this.weatherUtils.convertPressureToInches(pr); }
  getWindDirectionLabel(deg: number): string { return this.weatherUtils.getWindDirectionLabel(deg); }
  getRainTotal(data: WeatherData[]): number { return this.weatherUtils.getRainTotal(data); }
  roundDeg(deg: number): number { return Math.round(deg); }

  getWindDescription(speed: number, dirName: string): string {
    if (speed < 0.5) return `Calm — barely any movement.`;
    if (speed < 3) return `Light breeze from the ${dirName}. Pleasant conditions.`;
    if (speed < 8) return `Moderate breeze from the ${dirName}. Leaves and small branches moving.`;
    if (speed < 15) return `Fresh breeze from the ${dirName}. Noticeable wind, small trees swaying.`;
    if (speed < 25) return `Strong winds from the ${dirName}. Difficult to walk against.`;
    return `Very strong winds from the ${dirName}. Exercise caution outdoors.`;
  }

  getPressureDescription(value: number, trend: string): string {
    const v = value.toFixed(2);
    if (!trend || trend.includes('steady')) {
      if (value > 30.1) return `${v} inHg — high pressure holding. Fair, stable weather expected.`;
      if (value < 29.7) return `${v} inHg — low pressure persisting. Unsettled conditions likely.`;
      return `${v} inHg — pressure steady. Conditions unlikely to change soon.`;
    }
    if (trend.includes('falling')) {
      if (value < 29.7) return `${v} inHg and falling rapidly — storm or rain likely approaching.`;
      return `${v} inHg and easing — a gradual drop often nudges toward unsettled air ahead.`;
    }
    if (trend.includes('rising')) {
      return `${v} inHg and rising — improving conditions likely on the way.`;
    }
    return `${v} inHg.`;
  }
}
