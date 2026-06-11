import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { interval } from 'rxjs';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { SkeletonModule } from 'primeng/skeleton';
import { WeatherDataService } from '../../services/weather-data.service';
import { WeatherUtilsService } from '../../services/weather-utils.service';
import { MoonPhaseService } from '../../services/moon-phase.service';
import { ThemeService } from '../../services/theme.service';
import { WeatherData } from '../../models/weather-data.interface';
import { LinearMeterComponent } from '../shared/linear-meter/linear-meter.component';
import { NimbusCompassComponent } from '../shared/nimbus-compass/nimbus-compass.component';
import { MoonComponent } from '../shared/moon/moon.component';

// Hardcoded for now: a station picker is planned once the API exposes a station list.
const STATION_ID = '80bb40b5fce97afec61866080fa08e01';

type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';
type WeatherCondition = 'clear' | 'cloudy' | 'rain' | 'storm';

interface SunGlyph {
  left: string;
  top: string;
  size: number;
  color: string;
}

interface MoonGlyph {
  left: string;
  top: string;
  size: number;
}

interface CloudPlacement {
  leftPercent: number;
  topPercent: number;
  scale: number;
  opacity: number;
}

interface SkyTheme {
  gradient: string;
  stars: boolean;
  sun: SunGlyph | null;
  moon: MoonGlyph | null;
  clouds: CloudPlacement[] | null;
  rainLevel: 0 | 1 | 2;
  lightning: boolean;
}

interface Star {
  leftPercent: number;
  topPercent: number;
  radiusPx: number;
  twinkleDelaySeconds: number;
}

interface RainDrop {
  leftPercent: number;
  lengthPx: number;
  opacity: number;
  fallDurationSeconds: number;
  fallDelaySeconds: number;
}

interface TimeOfDayTheme {
  gradient: string;
  clearSkyGlow: string;
  sun?: SunGlyph;
  moon?: MoonGlyph;
}

/** Rainfall (mm in the latest reading) above which we call it a storm / rain. */
const STORM_RAINFALL_MM = 2;
const RAIN_RAINFALL_MM = 0.3;

const TIME_OF_DAY_THEMES: Record<TimeOfDay, TimeOfDayTheme> = {
  morning: {
    gradient: 'linear-gradient(180deg,oklch(0.66 0.105 252) 0%,oklch(0.80 0.075 234) 52%,oklch(0.90 0.075 74) 100%)',
    clearSkyGlow: 'radial-gradient(86% 70% at 84% 30%,oklch(0.94 0.10 84/.85),transparent 46%)',
    sun: { left: '82%', top: '30%', size: 60, color: 'oklch(0.94 0.105 86)' },
  },
  afternoon: {
    gradient: 'linear-gradient(180deg,oklch(0.575 0.13 252) 0%,oklch(0.76 0.10 236) 55%,oklch(0.88 0.06 232) 100%)',
    clearSkyGlow: 'radial-gradient(78% 66% at 84% 12%,oklch(0.97 0.085 96/.9),transparent 44%)',
    sun: { left: '82%', top: '14%', size: 64, color: 'oklch(0.97 0.09 96)' },
  },
  evening: {
    gradient: 'linear-gradient(180deg,oklch(0.34 0.10 292) 0%,oklch(0.54 0.145 24) 52%,oklch(0.72 0.15 56) 100%)',
    clearSkyGlow: 'radial-gradient(100% 80% at 78% 92%,oklch(0.83 0.16 58/.9),transparent 52%)',
    sun: { left: '77%', top: '82%', size: 72, color: 'oklch(0.85 0.155 60)' },
  },
  night: {
    gradient: 'linear-gradient(180deg,oklch(0.180 0.055 272) 0%,oklch(0.250 0.062 266) 48%,oklch(0.320 0.050 258) 100%)',
    clearSkyGlow: 'radial-gradient(150% 95% at 50% 124%,oklch(0.56 0.10 52/.42),transparent 60%)',
    moon: { left: '80%', top: '18%', size: 60 },
  },
};

const CONDITION_SKY_OVERLAYS: Record<WeatherCondition, string | null> = {
  clear: null,
  cloudy: 'linear-gradient(180deg,oklch(0.60 0.012 250/.42),oklch(0.54 0.012 250/.52))',
  rain: 'linear-gradient(180deg,oklch(0.46 0.014 252/.58),oklch(0.40 0.016 256/.68))',
  storm: 'linear-gradient(180deg,oklch(0.30 0.016 260/.70),oklch(0.20 0.020 262/.82))',
};

const CONDITION_CLOUDS: Record<WeatherCondition, CloudPlacement[] | null> = {
  clear: null,
  cloudy: [
    { leftPercent: 4, topPercent: 16, scale: 1.05, opacity: 0.9 },
    { leftPercent: 50, topPercent: 8, scale: 1.3, opacity: 0.96 },
    { leftPercent: 30, topPercent: 36, scale: 0.82, opacity: 0.8 },
  ],
  rain: [
    { leftPercent: 2, topPercent: 12, scale: 1.15, opacity: 0.95 },
    { leftPercent: 46, topPercent: 4, scale: 1.4, opacity: 0.97 },
    { leftPercent: 26, topPercent: 30, scale: 0.9, opacity: 0.9 },
  ],
  storm: [
    { leftPercent: 0, topPercent: 8, scale: 1.3, opacity: 0.97 },
    { leftPercent: 42, topPercent: 0, scale: 1.55, opacity: 0.98 },
    { leftPercent: 24, topPercent: 26, scale: 1.0, opacity: 0.95 },
  ],
};

const CONDITION_LABELS: Record<WeatherCondition, string> = {
  clear: 'Clear',
  cloudy: 'Cloudy',
  rain: 'Raining',
  storm: 'Thunderstorm',
};

const STARS: readonly Star[] = [
  { leftPercent: 8, topPercent: 22, radiusPx: 1.2, twinkleDelaySeconds: 0.2 },
  { leftPercent: 18, topPercent: 12, radiusPx: 0.9, twinkleDelaySeconds: 1.1 },
  { leftPercent: 26, topPercent: 30, radiusPx: 1.4, twinkleDelaySeconds: 0.6 },
  { leftPercent: 33, topPercent: 15, radiusPx: 1.0, twinkleDelaySeconds: 1.8 },
  { leftPercent: 42, topPercent: 27, radiusPx: 0.8, twinkleDelaySeconds: 0.9 },
  { leftPercent: 48, topPercent: 9, radiusPx: 1.2, twinkleDelaySeconds: 2.4 },
  { leftPercent: 56, topPercent: 21, radiusPx: 1.0, twinkleDelaySeconds: 0.4 },
  { leftPercent: 14, topPercent: 41, radiusPx: 1.0, twinkleDelaySeconds: 1.5 },
  { leftPercent: 38, topPercent: 44, radiusPx: 0.9, twinkleDelaySeconds: 2.1 },
  { leftPercent: 61, topPercent: 36, radiusPx: 1.3, twinkleDelaySeconds: 1.2 },
  { leftPercent: 69, topPercent: 17, radiusPx: 0.9, twinkleDelaySeconds: 0.7 },
  { leftPercent: 22, topPercent: 55, radiusPx: 0.8, twinkleDelaySeconds: 2.6 },
  { leftPercent: 50, topPercent: 51, radiusPx: 1.0, twinkleDelaySeconds: 1.4 },
  { leftPercent: 74, topPercent: 47, radiusPx: 0.9, twinkleDelaySeconds: 2.2 },
];

function buildRainDrops(count: number, options: { baseFallSeconds: number; delayStretch: number; lengthPx: number; opacity: number }): RainDrop[] {
  return Array.from({ length: count }, (unusedValue, index) => ({
    leftPercent: (index * 37 + (index % 5) * 6) % 100,
    fallDurationSeconds: options.baseFallSeconds + ((index * 7) % 5) / 12,
    fallDelaySeconds: -(((index * 11) % 13) / 10) * options.delayStretch,
    lengthPx: options.lengthPx,
    opacity: options.opacity,
  }));
}

const LIGHT_RAIN_DROPS = buildRainDrops(26, { baseFallSeconds: 0.85, delayStretch: 1.4, lengthPx: 15, opacity: 0.7 });
const HEAVY_RAIN_DROPS = buildRainDrops(46, { baseFallSeconds: 0.5, delayStretch: 1, lengthPx: 20, opacity: 0.92 });

@Component({
  selector: 'app-landing-page',
  imports: [NgTemplateOutlet, SkeletonModule, RouterLink, LinearMeterComponent, NimbusCompassComponent, MoonComponent],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingPageComponent {
  private readonly weatherDataService = inject(WeatherDataService);
  private readonly weatherUtils = inject(WeatherUtilsService);
  private readonly moonPhaseService = inject(MoonPhaseService);
  private readonly themeService = inject(ThemeService);

  protected readonly stars = STARS;
  protected readonly lightRainDrops = LIGHT_RAIN_DROPS;
  protected readonly heavyRainDrops = HEAVY_RAIN_DROPS;

  protected readonly weatherData = toSignal(this.weatherDataService.getCombinedWeatherData(STATION_ID));

  /** Wall-clock driver for everything time-based; ticks once per second. */
  private readonly nowSeconds = signal(Math.floor(Date.now() / 1000));

  protected readonly currentTime = computed(() =>
    new Date(this.nowSeconds() * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  );

  private readonly latestReading = computed<WeatherData | null>(() => {
    const data = this.weatherData();
    if (!data || data.current.state !== 'success' || data.current.data.length === 0) {
      return null;
    }
    return data.current.data[data.current.data.length - 1];
  });

  protected readonly lastReadingAgo = computed(() => {
    const latest = this.latestReading();
    if (!latest) {
      return '';
    }
    const elapsedSeconds = Math.max(0, this.nowSeconds() - latest.timestamp);
    if (elapsedSeconds < 60) {
      return `${elapsedSeconds}s ago`;
    }
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;
    return `${minutes}m ${String(seconds).padStart(2, '0')}s ago`;
  });

  // TODO: account for the station's location and timezone to get proper sunrise/sunset
  private readonly timeOfDay = computed<TimeOfDay>(() => {
    const hour = new Date(this.nowSeconds() * 1000).getHours();
    if (hour >= 5 && hour < 12) {
      return 'morning';
    }
    if (hour >= 12 && hour < 17) {
      return 'afternoon';
    }
    if (hour >= 17 && hour < 20) {
      return 'evening';
    }
    return 'night';
  });

  protected readonly condition = computed<WeatherCondition>(() => {
    const latest = this.latestReading();
    const rainfallMm = latest?.rainfall ?? 0;
    if (rainfallMm > STORM_RAINFALL_MM) {
      return 'storm';
    }
    if (rainfallMm > RAIN_RAINFALL_MM) {
      return 'rain';
    }
    return 'clear';
  });

  protected readonly conditionLabel = computed(() => CONDITION_LABELS[this.condition()]);

  protected readonly skyTheme = computed<SkyTheme>(() => this.buildSkyTheme(this.timeOfDay(), this.condition()));

  /** Rounded so the moon SVG only re-renders every few minutes, not every second. */
  protected readonly moonPhaseFraction = computed(() => {
    const now = new Date(this.nowSeconds() * 1000);
    return Math.round(this.moonPhaseService.getCycleFraction(now) * 10_000) / 10_000;
  });

  protected readonly moonPhaseName = computed(() =>
    this.moonPhaseService.getPhaseName(new Date(this.nowSeconds() * 1000))
  );

  constructor() {
    interval(1000)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.nowSeconds.set(Math.floor(Date.now() / 1000)));
  }

  protected get isDark(): boolean {
    return this.themeService.isDark;
  }

  protected toggleTheme(): void {
    this.themeService.toggle();
  }

  private buildSkyTheme(timeOfDay: TimeOfDay, condition: WeatherCondition): SkyTheme {
    const base = TIME_OF_DAY_THEMES[timeOfDay];
    const isClear = condition === 'clear';

    const layers: string[] = [];
    const conditionOverlay = CONDITION_SKY_OVERLAYS[condition];
    if (conditionOverlay) {
      layers.push(conditionOverlay);
    }
    if (isClear) {
      layers.push(base.clearSkyGlow);
    }
    layers.push(base.gradient);

    return {
      gradient: layers.join(', '),
      stars: timeOfDay === 'night' && isClear,
      sun: isClear ? base.sun ?? null : null,
      moon: isClear ? base.moon ?? null : null,
      clouds: CONDITION_CLOUDS[condition],
      rainLevel: condition === 'storm' ? 2 : condition === 'rain' ? 1 : 0,
      lightning: condition === 'storm',
    };
  }

  protected sunBackground(color: string): string {
    return `radial-gradient(circle at 50% 50%,${color} 0 52%,color-mix(in oklch,${color} 55%,transparent) 72%,transparent 86%)`;
  }

  protected sunGlow(color: string): string {
    return `0 0 48px 8px color-mix(in oklch,${color} 50%,transparent)`;
  }

  protected formatTempShort(tempC: number): string {
    return this.weatherUtils.formatTempShort(tempC, 'f');
  }

  protected calculateFeelsLikeTemp(tempC: number, humidity: number, windMph: number): number {
    return this.weatherUtils.calculateFeelsLikeTemp(tempC, humidity, windMph);
  }

  protected getPeakTemp(data: WeatherData[], latest?: WeatherData): string {
    const fahrenheit = this.weatherUtils.getPeakTempF(data, latest);
    return fahrenheit !== null ? fahrenheit.toFixed(0) + '°' : '--';
  }

  protected getMinTemp(data: WeatherData[], latest?: WeatherData): string {
    const fahrenheit = this.weatherUtils.getMinTempF(data, latest);
    return fahrenheit !== null ? fahrenheit.toFixed(0) + '°' : '--';
  }

  protected convertPressureToInches(pressure: number): number {
    return this.weatherUtils.convertPressureToInches(pressure);
  }

  protected getWindDirectionLabel(degrees: number): string {
    return this.weatherUtils.getWindDirectionLabel(degrees);
  }

  protected getTodayRainTotal(today: WeatherData[], current: WeatherData[]): number {
    const liveRainfallInches = this.weatherUtils.getLiveRainfallMmSinceLastHourly(today, current) / 25.4;
    return Math.round((this.weatherUtils.getRainTotal(today) + liveRainfallInches) * 100) / 100;
  }

  protected getRainMeterMax(total: number): number {
    return total <= 1 ? 1 : Math.ceil(total);
  }

  protected tempInF(latest: WeatherData): string {
    const fahrenheit = latest.temp * 9 / 5 + 32;
    return fahrenheit.toFixed(0);
  }
}
