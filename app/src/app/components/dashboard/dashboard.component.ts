import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import {combineLatest, interval, switchMap} from 'rxjs';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { SkeletonModule } from 'primeng/skeleton';
import { ThemeService } from '../../services/theme.service';
import { WeatherDataService } from '../../services/weather-data.service';
import { WeatherUtilsService } from '../../services/weather-utils.service';
import { WeatherData } from '../../models/weather-data.interface';
import { AreaChartComponent } from '../shared/area-chart/area-chart.component';
import { SparklineComponent } from '../shared/sparkline/sparkline.component';
import { NimbusCompassComponent } from '../shared/nimbus-compass/nimbus-compass.component';
import { PressureGaugeComponent } from '../shared/pressure-gauge/pressure-gauge.component';
import { DatePickerComponent } from '../shared/date-picker/date-picker.component';
import {DateTime, Duration} from "luxon";

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

function average(values: number[]): number | null {
  if (!values.length) {
    return null;
  }
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function formatOrDash(value: number | null | undefined, decimals: number): string {
  return value == null ? '--' : value.toFixed(decimals);
}

/** Mean of a set of compass bearings, via the sin/cos vector average the API uses per hour. */
function circularMeanDegrees(bearings: number[]): number | null {
  if (!bearings.length) {
    return null;
  }
  const radians = bearings.map(bearing => bearing * Math.PI / 180);
  const sinMean = average(radians.map(radian => Math.sin(radian)))!;
  const cosMean = average(radians.map(radian => Math.cos(radian)))!;
  return (Math.atan2(sinMean, cosMean) * 180 / Math.PI + 360) % 360;
}

@Component({
  selector: 'app-dashboard',
  imports: [NgTemplateOutlet, SkeletonModule, RouterLink, AreaChartComponent,
    SparklineComponent, NimbusCompassComponent, PressureGaugeComponent, DatePickerComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  private readonly weatherDataService = inject(WeatherDataService);
  private readonly weatherUtils = inject(WeatherUtilsService);
  private readonly datePipe = inject(DatePipe);
  private readonly themeService = inject(ThemeService);

  protected readonly liveMode = signal(false);

  dateSelected = signal<DateTime>(DateTime.now().startOf('day'));

  /**
   * Local midnight, re-read off the one-second tick so a page left open overnight notices the
   * date change. The equality check keeps it emitting once a day rather than once a second.
   */
  protected readonly today = computed(() => {
    this.nowSeconds();
    return DateTime.now().startOf('day');
  }, { equal: (a, b) => a.hasSame(b, 'day') });

  isToday = computed(() => this.dateSelected().hasSame(this.today(), 'day'));

  label = computed(() => {
    const date = this.dateSelected();
    return this.isToday() ? "Today" : date.toFormat("MMMM dd, yyyy");
  });

  /**
   * The data for the tab and day on screen — either one changing re-runs the fetch.
   * A past day is a one-shot fetch; today is polled, and the DAILY tab's poll never calls
   * the hour or summary endpoints.
   */
  protected readonly weatherData = toSignal(
    combineLatest([toObservable(this.liveMode), toObservable(this.dateSelected)]).pipe(
      switchMap(([live, date]) => {
        if (!this.isToday() && !live) {
          return this.weatherDataService.getWeatherForDate(STATION_ID, date);
        }
        return live
          ? this.weatherDataService.getLiveWeather(STATION_ID)
          : this.weatherDataService.getDailyWeather(STATION_ID);
      })
    )
  );

  /** Empty on the DAILY tab, which does not fetch the summary. */
  protected readonly aiSummary = computed(() => {
    const summary = this.weatherData()?.summary;
    return summary?.state === 'success' ? summary.data.summary : '';
  });


  subtractDay() {
    this.dateSelected.update(value => {
      return value.minus({days: 1});
    })
  }

  addDay() {
    this.dateSelected.update(value => {
      const dateSelectedPlus1 = value.plus({days: 1}).startOf('day');
      if (dateSelectedPlus1 > this.today()) {
        console.warn("Can not select a day in the future")
        return value;
      }
      return dateSelectedPlus1;
    })
  }

  goToToday() {
    this.dateSelected.set(this.today());
  }

  /**
   * Wall-clock driver for the offline badge. Ticks once a second so a station that stops reporting
   * mid-poll-interval is flagged as it crosses the threshold, not up to 30s later.
   */
  private readonly nowSeconds = signal(Math.floor(Date.now() / 1000));

  /**
   * The readings once the current and day calls succeed. `day` holds the hourly readings for
   * whichever day is on screen. `currentHour` is empty unless the LIVE tab is showing and its
   * minute readings have arrived.
   */
  private readonly loadedReadings = computed(() => {
    const data = this.weatherData();
    if (!data || data.current.state !== 'success' || data.day.state !== 'success') {
      return null;
    }
    return {
      current: data.current.data,
      day: data.day.data,
      currentHour: data.currentHour?.state === 'success' ? data.currentHour.data : []
    };
  });

  /**
   * Whether the day on screen has any readings. A day the station spent offline — or that
   * predates it entirely — comes back empty, and there is nothing to plot.
   */
  protected readonly hasDayReadings = computed(() => (this.loadedReadings()?.day.length ?? 0) > 0);

  /** Reads inside a sentence, so today is lowercase rather than the "Today" button label. */
  protected readonly emptyDayLabel = computed(() => this.isToday() ? 'today' : this.label());

  /**
   * The big numbers on the temperature, humidity, and wind cards. Today shows the station's
   * newest reading; a past day shows that day's average, since its "latest" is just whatever
   * the reading happened to be when the day ended.
   */
  private readonly headline = computed(() => {
    const loaded = this.loadedReadings();
    if (!loaded) {
      return null;
    }
    if (!this.isToday()) {
      return {
        tempF: average(loaded.day.map(reading => celsiusToFahrenheit(reading.temp))),
        humidity: average(loaded.day.map(reading => reading.hum))
      };
    }
    const reading = loaded.current?.reading;
    if (!reading) {
      return null;
    }
    return { tempF: celsiusToFahrenheit(reading.temp), humidity: reading.hum };
  });

  protected readonly headlineTempF = computed(() => formatOrDash(this.headline()?.tempF, 1));

  protected readonly headlineHumidity = computed(() => formatOrDash(this.headline()?.humidity, 1));

  /**
   * What the compass points at: the current wind today, or the day's prevailing wind when
   * looking back — the circular mean of its hourly bearings, the same way the API averages
   * bearings within an hour, paired with the day's average speed.
   */
  protected readonly windSummary = computed(() => {
    const loaded = this.loadedReadings();
    if (!loaded) {
      return null;
    }
    if (this.isToday()) {
      const reading = loaded.current?.reading;
      return reading ? { degrees: reading.windDirection, speed: reading.windSpeed } : null;
    }
    const degrees = circularMeanDegrees(loaded.day.map(reading => reading.windDirection));
    const speed = average(loaded.day.map(reading => reading.windSpeed));
    return degrees === null || speed === null ? null : { degrees, speed };
  });

  protected readonly headlineWindSpeed = computed(() => formatOrDash(this.windSummary()?.speed, 2));

  /** Gauge value: the current pressure today, the day's average when looking back. */
  protected readonly pressureInHg = computed(() => {
    const loaded = this.loadedReadings();
    if (!loaded) {
      return null;
    }
    if (this.isToday()) {
      const reading = loaded.current?.reading;
      return reading ? this.weatherUtils.convertPressureToInches(reading.pr) : null;
    }
    const dayAverageHpa = average(loaded.day.map(reading => reading.pr));
    return dayAverageHpa === null ? null : this.weatherUtils.convertPressureToInches(dayAverageHpa);
  });

  /** How far the barometer moved across the day on screen, first reading to last. */
  protected readonly pressureChangeInHg = computed(() => {
    const readings = sortByTimestamp(this.loadedReadings()?.day ?? []);
    if (readings.length < 2) {
      return null;
    }
    return this.weatherUtils.convertPressureToInches(readings[readings.length - 1].pr - readings[0].pr);
  });

  /** The day's high and low. Today's includes the newest reading; a past day's cannot. */
  protected readonly peakTempF = computed(() => formatOrDash(
    this.weatherUtils.getPeakTempF(this.loadedReadings()?.day ?? [], this.latestForDay()), 1
  ));

  protected readonly lowTempF = computed(() => formatOrDash(
    this.weatherUtils.getMinTempF(this.loadedReadings()?.day ?? [], this.latestForDay()), 1
  ));

  protected readonly isStale = computed(() =>
    this.weatherUtils.isStale(this.loadedReadings()?.current ?? null, this.nowSeconds())
  );

  protected readonly lastReadingAgo = computed(() => {
    const reading = this.loadedReadings()?.current?.reading;
    if (!reading) {
      return '';
    }
    return this.weatherUtils.formatElapsed(this.weatherUtils.elapsedSince(reading, this.nowSeconds()));
  });

  /** The day that was "today" when the rollover effect last ran. */
  private previousToday = DateTime.now().startOf('day');

  constructor() {
    interval(1000)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.nowSeconds.set(Math.floor(Date.now() / 1000)));

    // A dashboard left open overnight should follow the clock: at midnight, someone watching
    // "Today" moves to the new day. Someone who had deliberately navigated to an older day
    // stays where they are.
    effect(() => {
      const today = this.today();
      untracked(() => {
        const rolledOverFrom = this.previousToday;
        this.previousToday = today;
        if (!today.hasSame(rolledOverFrom, 'day') && this.dateSelected().hasSame(rolledOverFrom, 'day')) {
          this.dateSelected.set(today);
        }
      });
    });
  }

  /**
   * The readings driving the charts, per the tab.
   * LIVE shows this hour's raw minute readings; DAILY shows the hourly aggregates
   * (which, being computed at read time, already include the in-progress hour).
   */
  private readonly chartReadings = computed<WeatherData[]>(() => {
    const loaded = this.loadedReadings();
    if (!loaded) {
      return [];
    }
    return sortByTimestamp(this.liveMode() ? loaded.currentHour : loaded.day);
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

  /** The selected day's rain total. */
  protected readonly rainTotal = computed(() =>
    this.weatherUtils.getRainTotal(this.loadedReadings()?.day ?? [])
  );

  /** How many x-axis labels to skip between ticks; minute data needs more thinning. */
  protected readonly xLabelEvery = computed(() => this.liveMode() ? 6 : 4);

  protected readonly chartModeNote = computed(() => this.liveMode() ? 'live · minute' : 'Hourly');

  protected readonly rainModeNote = computed(() => this.liveMode() ? 'live · minute' : 'Total');

  protected readonly pressureTrend = computed(() => {
    const loaded = this.loadedReadings();
    if (!loaded || loaded.day.length < 4) {
      return '';
    }
    const sorted = sortByTimestamp(loaded.day);
    const recentPressure = sorted[sorted.length - 1].pr;
    // Today: where the last few hours are heading. A past day: what it did start to finish.
    const earlierPressure = this.isToday() ? sorted[sorted.length - 4].pr : sorted[0].pr;
    const pressureDelta = recentPressure - earlierPressure;
    if (pressureDelta < -0.5) {
      return '↓ falling';
    }
    if (pressureDelta > 0.5) {
      return '↑ rising';
    }
    return '→ steady';
  });

  /** The selected day's wind readings for the compass card's sparkline. */
  protected readonly dayWindValues = computed(() =>
    sortByTimestamp(this.loadedReadings()?.day ?? []).map(reading => reading.windSpeed)
  );

  /** The selected day's pressure readings for the gauge card's sparkline. */
  protected readonly dayPressureValues = computed(() =>
    sortByTimestamp(this.loadedReadings()?.day ?? []).map(reading => hectopascalsToInchesOfMercury(reading.pr))
  );

  /** The newest reading, but only when it belongs to the day on screen. */
  private latestForDay(): WeatherData | undefined {
    return this.isToday() ? this.loadedReadings()?.current?.reading : undefined;
  }

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

  protected getFeelsLike(tempC: number, humidity: number, windMph: number): string {
    const feelsLikeC = this.weatherUtils.calculateFeelsLikeTemp(tempC, humidity, windMph);
    return celsiusToFahrenheit(feelsLikeC).toFixed(1);
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

  /** Past-day counterpart to {@link getWindDescription}: how the day blew, not how it blows. */
  protected getDayWindDescription(averageSpeedMph: number): string {
    if (averageSpeedMph < 0.5) {
      return `A calm day, with barely any air movement.`;
    }
    if (averageSpeedMph < 3) {
      return `A light day for wind — pleasant throughout.`;
    }
    if (averageSpeedMph < 8) {
      return `A moderate breeze for most of the day.`;
    }
    if (averageSpeedMph < 15) {
      return `A breezy day, enough to keep small trees swaying.`;
    }
    if (averageSpeedMph < 25) {
      return `A windy day — strong enough to lean into.`;
    }
    return `A very windy day.`;
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

  /**
   * Past-day counterpart to {@link getPressureDescription}: the day's average and how far the
   * barometer moved between its first and last reading.
   */
  protected getDayPressureDescription(averageInHg: number, changeInHg: number | null): string {
    const formattedAverage = averageInHg.toFixed(2);
    if (changeInHg === null) {
      return `${formattedAverage} inHg on average across the day.`;
    }
    const formattedChange = Math.abs(changeInHg).toFixed(2);
    if (changeInHg <= -0.02) {
      return `${formattedAverage} inHg on average, falling ${formattedChange} inHg through the day — the kind of drop that brings unsettled air.`;
    }
    if (changeInHg >= 0.02) {
      return `${formattedAverage} inHg on average, rising ${formattedChange} inHg through the day — conditions settling.`;
    }
    return `${formattedAverage} inHg on average, holding steady all day.`;
  }
}
