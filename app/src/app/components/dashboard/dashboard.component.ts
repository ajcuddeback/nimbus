import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { SkeletonModule } from 'primeng/skeleton';
import { ThemeService } from '../../services/theme.service';
import { WeatherDataService } from '../../services/weather-data.service';
import { WeatherUtilsService } from '../../services/weather-utils.service';
import { WeatherData } from '../../models/weather-data.interface';
import { AreaChartComponent } from '../shared/area-chart/area-chart.component';
import { SparklineComponent } from '../shared/sparkline/sparkline.component';
import { NimbusCompassComponent } from '../shared/nimbus-compass/nimbus-compass.component';
import { PressureGaugeComponent } from '../shared/pressure-gauge/pressure-gauge.component';

// Hardcoded for now: a station picker is planned once the API exposes a station list.
const STATION_ID = '80bb40b5fce97afec61866080fa08e01';

function celsiusToFahrenheit(tempC: number): number {
  return tempC * 9 / 5 + 32;
}

function hectopascalsToInchesOfMercury(pressureHpa: number): number {
  return +(pressureHpa * 0.02953).toFixed(3);
}

function millimetersToInches(millimeters: number): number {
  return +(millimeters / 25.4).toFixed(3);
}

function sortByTimestamp(readings: WeatherData[]): WeatherData[] {
  return [...readings].sort((first, second) => first.timestamp - second.timestamp);
}

@Component({
  selector: 'app-dashboard',
  imports: [NgTemplateOutlet, SkeletonModule, RouterLink,
    AreaChartComponent, SparklineComponent, NimbusCompassComponent, PressureGaugeComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  private readonly weatherDataService = inject(WeatherDataService);
  private readonly weatherUtils = inject(WeatherUtilsService);
  private readonly datePipe = inject(DatePipe);
  private readonly themeService = inject(ThemeService);

  protected readonly weatherData = toSignal(this.weatherDataService.getCombinedWeatherData(STATION_ID));
  protected readonly liveMode = signal(false);

  /** Current and today readings, available only once both requests succeed. */
  private readonly loadedReadings = computed(() => {
    const data = this.weatherData();
    if (!data || data.current.state !== 'success' || data.today.state !== 'success') {
      return null;
    }
    return { current: data.current.data, today: data.today.data };
  });

  /**
   * Today's hourly readings plus a synthetic reading for the in-progress
   * hour, whose rainfall is the rain seen since the last hourly reading.
   */
  private readonly todayWithCurrentHour = computed<WeatherData[]>(() => {
    const loaded = this.loadedReadings();
    if (!loaded) {
      return [];
    }
    if (!loaded.current.length) {
      return loaded.today;
    }
    const currentHourRainfall = this.weatherUtils.getLiveRainfallMmSinceLastHourly(loaded.today, loaded.current);
    const latest = loaded.current[loaded.current.length - 1];
    return [...loaded.today, { ...latest, rainfall: currentHourRainfall }];
  });

  /** The readings driving the charts, per the LIVE/TODAY toggle. */
  private readonly chartReadings = computed<WeatherData[]>(() => {
    const loaded = this.loadedReadings();
    if (!loaded) {
      return [];
    }
    return sortByTimestamp(this.liveMode() ? loaded.current : this.todayWithCurrentHour());
  });

  protected readonly chartLabels = computed(() =>
    this.chartReadings().map(reading => this.formatTimeLabel(reading.timestamp))
  );

  protected readonly temperatureValues = computed(() =>
    this.chartReadings().map(reading => +celsiusToFahrenheit(reading.temp).toFixed(1))
  );

  protected readonly humidityValues = computed(() =>
    this.chartReadings().map(reading => reading.hum)
  );

  protected readonly windSpeedValues = computed(() =>
    this.chartReadings().map(reading => reading.windSpeed)
  );

  protected readonly rainCumulativeValues = computed(() => {
    let runningTotalInches = 0;
    return this.chartReadings().map(reading => {
      runningTotalInches += millimetersToInches(reading.rainfall);
      return +runningTotalInches.toFixed(3);
    });
  });

  protected readonly rainTotalToday = computed(() =>
    this.weatherUtils.getRainTotal(this.todayWithCurrentHour())
  );

  /** How many x-axis labels to skip between ticks; minute data needs more thinning. */
  protected readonly xLabelEvery = computed(() => this.liveMode() ? 6 : 4);

  protected readonly chartModeNote = computed(() => this.liveMode() ? 'live · minute' : 'today · hourly');

  protected readonly rainModeNote = computed(() => this.liveMode() ? 'live · minute' : 'today · total');

  protected readonly pressureTrend = computed(() => {
    const loaded = this.loadedReadings();
    if (!loaded || loaded.today.length < 4) {
      return '';
    }
    const sorted = sortByTimestamp(loaded.today);
    const recentPressure = sorted[sorted.length - 1].pr;
    const earlierPressure = sorted[Math.max(0, sorted.length - 4)].pr;
    const pressureDelta = recentPressure - earlierPressure;
    if (pressureDelta < -0.5) {
      return '↓ falling';
    }
    if (pressureDelta > 0.5) {
      return '↑ rising';
    }
    return '→ steady';
  });

  /** Today's wind readings for the compass card's sparkline. */
  protected readonly todayWindValues = computed(() =>
    sortByTimestamp(this.loadedReadings()?.today ?? []).map(reading => reading.windSpeed)
  );

  /** Today's pressure readings for the gauge card's sparkline. */
  protected readonly todayPressureValues = computed(() =>
    sortByTimestamp(this.loadedReadings()?.today ?? []).map(reading => hectopascalsToInchesOfMercury(reading.pr))
  );

  protected get isDark(): boolean {
    return this.themeService.isDark;
  }

  protected toggleTheme(): void {
    this.themeService.toggle();
  }

  protected setLiveMode(live: boolean): void {
    this.liveMode.set(live);
  }

  private formatTimeLabel(timestamp: number): string {
    return this.datePipe.transform(new Date(timestamp * 1000), 'h:mm a') ?? '';
  }

  protected getLastUpdateTime(latest: WeatherData): string {
    if (!latest?.timestamp) {
      return '';
    }
    return this.formatTimeLabel(latest.timestamp);
  }

  protected formatTempF(tempC: number): string {
    return celsiusToFahrenheit(tempC).toFixed(1);
  }

  protected getFeelsLike(tempC: number, humidity: number, windMph: number): string {
    const feelsLikeC = this.weatherUtils.calculateFeelsLikeTemp(tempC, humidity, windMph);
    return celsiusToFahrenheit(feelsLikeC).toFixed(1);
  }

  protected getPeakTemp(today: WeatherData[], latest?: WeatherData): string {
    const fahrenheit = this.weatherUtils.getPeakTempF(today, latest);
    return fahrenheit !== null ? fahrenheit.toFixed(1) : '--';
  }

  protected getLowTemp(today: WeatherData[], latest?: WeatherData): string {
    const fahrenheit = this.weatherUtils.getMinTempF(today, latest);
    return fahrenheit !== null ? fahrenheit.toFixed(1) : '--';
  }

  protected convertPressureToInches(pressure: number): number {
    return this.weatherUtils.convertPressureToInches(pressure);
  }

  protected getWindDirectionLabel(degrees: number): string {
    return this.weatherUtils.getWindDirectionLabel(degrees);
  }

  protected roundDeg(degrees: number): number {
    return Math.round(degrees);
  }

  protected getWindDescription(speedMph: number, directionName: string): string {
    if (speedMph < 0.5) {
      return `Calm — barely any movement.`;
    }
    if (speedMph < 3) {
      return `Light breeze from the ${directionName}. Pleasant conditions.`;
    }
    if (speedMph < 8) {
      return `Moderate breeze from the ${directionName}. Leaves and small branches moving.`;
    }
    if (speedMph < 15) {
      return `Fresh breeze from the ${directionName}. Noticeable wind, small trees swaying.`;
    }
    if (speedMph < 25) {
      return `Strong winds from the ${directionName}. Difficult to walk against.`;
    }
    return `Very strong winds from the ${directionName}. Exercise caution outdoors.`;
  }

  protected getPressureDescription(valueInHg: number, trend: string): string {
    const formattedValue = valueInHg.toFixed(2);
    if (!trend || trend.includes('steady')) {
      if (valueInHg > 30.1) {
        return `${formattedValue} inHg — high pressure holding. Fair, stable weather expected.`;
      }
      if (valueInHg < 29.7) {
        return `${formattedValue} inHg — low pressure persisting. Unsettled conditions likely.`;
      }
      return `${formattedValue} inHg — pressure steady. Conditions unlikely to change soon.`;
    }
    if (trend.includes('falling')) {
      if (valueInHg < 29.7) {
        return `${formattedValue} inHg and falling rapidly — storm or rain likely approaching.`;
      }
      return `${formattedValue} inHg and easing — a gradual drop often nudges toward unsettled air ahead.`;
    }
    if (trend.includes('rising')) {
      return `${formattedValue} inHg and rising — improving conditions likely on the way.`;
    }
    return `${formattedValue} inHg.`;
  }
}
