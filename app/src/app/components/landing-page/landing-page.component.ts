import { Component, OnInit, OnDestroy } from '@angular/core';
import { AsyncPipe, NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Observable, Subscription, interval, tap } from 'rxjs';
import { SkeletonModule } from 'primeng/skeleton';
import { CombinedWeatherData, WeatherDataService } from '../../services/weather-data.service';
import { WeatherUtilsService } from '../../services/weather-utils.service';
import { WeatherData } from '../../models/weather-data.interface';
import { LinearMeterComponent } from '../shared/linear-meter/linear-meter.component';
import { NimbusCompassComponent } from '../shared/nimbus-compass/nimbus-compass.component';
import { ThemeService } from '../../services/theme.service';
import {MoonPhase} from '../../models/moonPhase.enum';

type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';
type WeatherCondition = 'clear' | 'cloudy' | 'rain' | 'storm';

interface SkyGlyph { type: 'sun' | 'moon'; left: string; top: string; size: number; color?: string; }
interface CloudItem { l: number; t: number; s: number; o: number; }
interface Clouds { color: string; items: CloudItem[]; }
interface SkyTheme {
  gradient: string; stars: boolean; glyph: SkyGlyph | null;
  clouds: Clouds | null; rainLevel: 0 | 1 | 2; lightning: boolean;
}

const TIME_OF_DAY_CONFIG = {
  morning:   { grad: 'linear-gradient(180deg,oklch(0.66 0.105 252) 0%,oklch(0.80 0.075 234) 52%,oklch(0.90 0.075 74) 100%)', glow: 'radial-gradient(86% 70% at 84% 30%,oklch(0.94 0.10 84/.85),transparent 46%)', sun: { left:'82%', top:'30%', size:60, color:'oklch(0.94 0.105 86)' } },
  afternoon: { grad: 'linear-gradient(180deg,oklch(0.575 0.13 252) 0%,oklch(0.76 0.10 236) 55%,oklch(0.88 0.06 232) 100%)', glow: 'radial-gradient(78% 66% at 84% 12%,oklch(0.97 0.085 96/.9),transparent 44%)', sun: { left:'82%', top:'14%', size:64, color:'oklch(0.97 0.09 96)' } },
  evening:   { grad: 'linear-gradient(180deg,oklch(0.34 0.10 292) 0%,oklch(0.54 0.145 24) 52%,oklch(0.72 0.15 56) 100%)', glow: 'radial-gradient(100% 80% at 78% 92%,oklch(0.83 0.16 58/.9),transparent 52%)', sun: { left:'77%', top:'82%', size:72, color:'oklch(0.85 0.155 60)' } },
  night:     { grad: 'linear-gradient(180deg,oklch(0.180 0.055 272) 0%,oklch(0.250 0.062 266) 48%,oklch(0.320 0.050 258) 100%)', glow: 'radial-gradient(150% 95% at 50% 124%,oklch(0.56 0.10 52/.42),transparent 60%)', moon: { left:'80%', top:'18%', size:60 } },
} as const;

const CONDITION_SKY_OVERLAY: Record<WeatherCondition, string | null> = {
  clear: null,
  cloudy: 'linear-gradient(180deg,oklch(0.60 0.012 250/.42),oklch(0.54 0.012 250/.52))',
  rain:   'linear-gradient(180deg,oklch(0.46 0.014 252/.58),oklch(0.40 0.016 256/.68))',
  storm:  'linear-gradient(180deg,oklch(0.30 0.016 260/.70),oklch(0.20 0.020 262/.82))',
};

const CLOUD_CONFIG: Record<string, Clouds | null> = {
  clear: null,
  cloudy: { color:'oklch(0.88 0.012 250)', items:[{l:4,t:16,s:1.05,o:.9},{l:50,t:8,s:1.3,o:.96},{l:30,t:36,s:.82,o:.8}] },
  rain:   { color:'oklch(0.74 0.013 252)', items:[{l:2,t:12,s:1.15,o:.95},{l:46,t:4,s:1.4,o:.97},{l:26,t:30,s:.9,o:.9}] },
  storm:  { color:'oklch(0.44 0.016 260)', items:[{l:0,t:8,s:1.3,o:.97},{l:42,t:0,s:1.55,o:.98},{l:24,t:26,s:1.0,o:.95}] },
};

@Component({
  selector: 'app-landing-page',
  imports: [AsyncPipe, NgTemplateOutlet, SkeletonModule, RouterLink, LinearMeterComponent, NimbusCompassComponent],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss'
})
export class LandingPageComponent implements OnInit, OnDestroy {
  weatherData$: Observable<CombinedWeatherData>;
  tempFormat: 'f' | 'c' = 'f';
  currentTime = '';
  lastReadingAgo = '';
  private latestTimestamp = 0;
  private clockSub?: Subscription;

  get isDark(): boolean { return this.theme.isDark; }
  toggleTheme(): void { this.theme.toggle(); }

  readonly STARS = [
    {x:8,y:22,r:1.2,d:.2},{x:18,y:12,r:.9,d:1.1},{x:26,y:30,r:1.4,d:.6},{x:33,y:15,r:1.0,d:1.8},
    {x:42,y:27,r:.8,d:.9},{x:48,y:9,r:1.2,d:2.4},{x:56,y:21,r:1.0,d:.4},{x:14,y:41,r:1.0,d:1.5},
    {x:38,y:44,r:.9,d:2.1},{x:61,y:36,r:1.3,d:1.2},{x:69,y:17,r:.9,d:.7},{x:22,y:55,r:.8,d:2.6},
    {x:50,y:51,r:1.0,d:1.4},{x:74,y:47,r:.9,d:2.2},
  ];

  readonly LIGHT_DROPS = Array.from({length:26},(_, i)=>({
    left:(i*37+(i%5)*6)%100, dur:.85+((i*7)%5)/12, delay:-(((i*11)%13)/10)*1.4, len:15, op:.7
  }));
  readonly HEAVY_DROPS = Array.from({length:46},(_, i)=>({
    left:(i*37+(i%5)*6)%100, dur:.5+((i*7)%5)/12, delay:-(((i*11)%13)/10), len:20, op:.92
  }));

  constructor(
    private weatherDataService: WeatherDataService,
    private weatherUtils: WeatherUtilsService,
    private theme: ThemeService
  ) {}

  ngOnInit(): void {
    this.weatherData$ = this.weatherDataService
      .getCombinedWeatherData('80bb40b5fce97afec61866080fa08e01')
      .pipe(
        tap(data => {
          if (data.current.state === 'success' && data.current.data.length > 0) {
            this.latestTimestamp = data.current.data[data.current.data.length - 1].timestamp;
          }
        })
      );
    this.updateClock();
    this.updateAgo();
    this.clockSub = interval(1000).subscribe(() => {
      this.updateAgo();
      // refresh the displayed clock once per minute
      if (new Date().getSeconds() === 0) {
        this.updateClock();
      }
    });
  }

  ngOnDestroy(): void {
    this.clockSub?.unsubscribe();
  }

  private updateClock(): void {
    this.currentTime = new Date().toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit', hour12:true });
  }

  private updateAgo(): void {
    if (!this.latestTimestamp) {
      return;
    }
    const sec = Math.max(0, Math.floor(Date.now() / 1000 - this.latestTimestamp));
    if (sec < 60) {
      this.lastReadingAgo = `${sec}s ago`;
    } else {
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      this.lastReadingAgo = `${m}m ${String(s).padStart(2, '0')}s ago`;
    }
  }

  // TODO: Change TOD to account for location and TZ to get proper sunset
  get timeOfDay(): TimeOfDay {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) {
      return 'morning';
    }
    if (h >= 12 && h < 17) {
      return 'afternoon';
    }
    if (h >= 17 && h < 20) {
      return 'evening';
    }
    return 'night';
  }

  getCondition(latest: WeatherData): WeatherCondition {
    if (!latest) {
      return 'clear';
    }
    const mm = latest.rainfall ?? 0;
    if (mm > 2) {
      return 'storm';
    }
    if (mm > 0.3) {
      return 'rain';
    }
    return 'clear';
  }

  computeSkyTheme(latest: WeatherData): SkyTheme {
    const timeOfDay = this.timeOfDay;
    const condition = this.getCondition(latest);
    const base = TIME_OF_DAY_CONFIG[timeOfDay] as any;
    const layers: string[] = [];
    if (condition === 'clear') {
      layers.push(base.glow);
    }
    layers.push(base.grad);
    let gradient = layers.join(', ');
    const skyOverlay = CONDITION_SKY_OVERLAY[condition];
    if (skyOverlay) {
      gradient = skyOverlay + ', ' + gradient;
    }
    let glyph: SkyGlyph | null = null;
    if (condition === 'clear') {
      if (timeOfDay === 'night' && base.moon) {
        glyph = { type: 'moon', ...base.moon };
      } else if (base.sun) {
        glyph = { type: 'sun', ...base.sun };
      }
    }
    return {
      gradient, glyph,
      stars: timeOfDay === 'night' && condition === 'clear',
      clouds: CLOUD_CONFIG[condition] ?? null,
      rainLevel: condition === 'storm' ? 2 : condition === 'rain' ? 1 : 0,
      lightning: condition === 'storm',
    };
  }

  sunBackground(color: string): string {
    return `radial-gradient(circle at 50% 50%,${color} 0 52%,color-mix(in oklch,${color} 55%,transparent) 72%,transparent 86%)`;
  }
  sunGlow(color: string): string {
    return `0 0 48px 8px color-mix(in oklch,${color} 50%,transparent)`;
  }

  getConditionLabel(condition: WeatherCondition): string {
    return { clear:'Clear', cloudy:'Cloudy', rain:'Raining', storm:'Thunderstorm' }[condition];
  }

  formatTempShort(temp: number): string {
    return this.weatherUtils.formatTempShort(temp, this.tempFormat);
  }

  calculateFeelsLikeTemp(tempC: number, humidity: number, windMph: number): number {
    return this.weatherUtils.calculateFeelsLikeTemp(tempC, humidity, windMph);
  }

  getPeakTemp(data: WeatherData[], latest?: WeatherData): string {
    const f = this.weatherUtils.getPeakTempF(data, latest);
    return f !== null ? f.toFixed(0) + '°' : '--';
  }

  getMinTemp(data: WeatherData[], latest?: WeatherData): string {
    const f = this.weatherUtils.getMinTempF(data, latest);
    return f !== null ? f.toFixed(0) + '°' : '--';
  }

  convertPressureToInches(pressure: number): number {
    return this.weatherUtils.convertPressureToInches(pressure);
  }

  getWindDirectionLabel(degrees: number): string {
    return this.weatherUtils.getWindDirectionLabel(degrees);
  }

  getRainTotal(weatherData: WeatherData[]): number {
    return this.weatherUtils.getRainTotal(weatherData);
  }

  getTodayRainTotal(today: WeatherData[], current: WeatherData[]): number {
    return Math.round((this.weatherUtils.getRainTotal(today) + this.weatherUtils.getRainTotal(current)) * 100) / 100;
  }

  getRainMeterMax(total: number): number {
    return total <= 1 ? 1 : Math.ceil(total);
  }

  tempInF(latest: WeatherData): string {
    const f = latest.temp * 9/5 + 32;
    return f.toFixed(0);
  }


  getMoonPhase() {
    const knownNewMoon = new Date('2000-01-06T18:14:00Z').getTime();
    const now = Date.now();
    const diffDays = (now - knownNewMoon) / (1000 * 60 * 60 * 24);
    const lunarCycleDays = 29.530588853;
    const dayDif =  diffDays % lunarCycleDays; // 0–29.53, where 0 = new moon

    if (dayDif === 0) {
      return MoonPhase.NEW_MOON;
    }

    if (dayDif > 0 && dayDif < 7.4) {
      return MoonPhase.WAXING_CRESCENT;
    }

    if (dayDif === 7.4) {
      return MoonPhase.FIRST_QUARTER;
    }

    if (dayDif > 7.4 && dayDif < 14.8) {
      return MoonPhase.WAXING_GIBBOUS;
    }

    if (dayDif === 14.8) {
      return MoonPhase.FULL_MOON;
    }

    if (dayDif > 14.8 && dayDif < 22.1) {
      return MoonPhase.WANING_GIBBOUS;
    }

    if (dayDif === 22.1) {
      return MoonPhase.THIRD_QUARTER;
    }

    if (dayDif > 22.1 && dayDif <= 29.5) {
      return MoonPhase.WANING_CRESCENT;
    }

    return MoonPhase.FULL_MOON;
  }

  protected readonly MoonPhase = MoonPhase;
}
