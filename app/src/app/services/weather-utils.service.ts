import { Injectable } from '@angular/core';
import { DatePipe } from '@angular/common';
import { WeatherData } from '../models/weather-data.interface';

@Injectable({
  providedIn: 'root'
})
export class WeatherUtilsService {
  constructor(private datePipe: DatePipe) {}

  // Temperature formatting
  formatTemp(temp: number, format: 'f' | 'c'): string {
    if (format === 'f') {
      return this.formatToF(temp);
    } else {
      return this.formatToC(temp);
    }
  }

  formatToF(temp: number): string {
    return (temp * (9 / 5) + 32).toFixed(2) + ' °F';
  }

  formatToC(temp: number): string {
    return temp.toFixed(2) + ' °C';
  }

  formatTempShort(temp: number, format: 'f' | 'c'): string {
    if (format === 'f') {
      return (temp * (9 / 5) + 32).toFixed(0) + '°';
    } else {
      return temp.toFixed(0) + '°';
    }
  }

  // Feels like calculation using heat index and wind chill
  calculateFeelsLikeTemp(tempC: number, humidity: number, windMph: number): number {
    const windKph = windMph * 1.609;
    const tempF = (tempC * 9) / 5 + 32;

    // Heat index for hot and humid conditions
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

    // Wind chill for cold and windy conditions
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

  // Peak/min calculations
  getPeakTemp(weatherData: WeatherData[], format: 'f' | 'c'): string {
    if (!weatherData || weatherData.length === 0) return 'Peak Temp not available';
    const peak = Math.max(...weatherData.map(data => data.temp));
    if (peak === Number.NEGATIVE_INFINITY || peak === Number.POSITIVE_INFINITY) {
      return 'Peak Temp not available';
    }
    return this.formatTemp(peak, format);
  }

  getMinTemp(weatherData: WeatherData[], format: 'f' | 'c'): string {
    if (!weatherData || weatherData.length === 0) return 'Min Temp not available';
    const min = Math.min(...weatherData.map(data => data.temp));
    if (min === Number.NEGATIVE_INFINITY || min === Number.POSITIVE_INFINITY) {
      return 'Min Temp not available';
    }
    return this.formatTemp(min, format);
  }

  getPeakHumidity(weatherData: WeatherData[]): string {
    if (!weatherData || weatherData.length === 0) return 'Peak Humidity not available';
    const peak = Math.max(...weatherData.map(data => data.hum));
    if (peak === Number.NEGATIVE_INFINITY || peak === Number.POSITIVE_INFINITY) {
      return 'Peak Humidity not available';
    }
    return peak + '%';
  }

  // Conversions
  convertPressureToInches(pressure: number): number {
    return +(pressure * 0.02953).toFixed(2);
  }

  getWindDirectionLabel(degrees: number): string {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  }

  getRainTotal(weatherData: WeatherData[]): number {
    if (!weatherData || weatherData.length === 0) return 0;
    return Math.round(weatherData.reduce((acc, curr) => acc + (curr.rainfall / 25.4), 0) * 100) / 100;
  }

  // Data gathering helpers
  gatherTimestamps(weatherData: WeatherData[]): string[] {
    return weatherData.map(data => {
      const date = new Date(data.timestamp * 1000);
      return this.datePipe.transform(date, 'h:mm a') ?? '';
    });
  }

  gatherTemps(weatherData: WeatherData[]): number[] {
    return weatherData.map(data => data.temp);
  }

  gatherHumidity(weatherData: WeatherData[]): number[] {
    return weatherData.map(data => data.hum);
  }

  gatherWindSpeeds(weatherData: WeatherData[]): number[] {
    return weatherData.map(data => data.windSpeed);
  }

  gatherPressures(weatherData: WeatherData[]): number[] {
    return weatherData.map(data => this.convertPressureToInches(data.pr));
  }

  gatherRainfall(weatherData: WeatherData[]): number[] {
    return weatherData.map(data => Math.round((data.rainfall / 25.4) * 100) / 100);
  }
}
