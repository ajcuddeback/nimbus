export interface WeatherData {
  temp: number;
  tempFormat: string;
  hum: number;
  pr: number;
  prFormat: string;
  timestamp: number;
  stationId: string;
  id?: string | undefined;
  windDirection: number;
  windSpeed: number;
  windSpeedFormat: string;
  rainfall: number;
  rainfallFormat: string;
}

/**
 * The station's newest reading plus how old it is. A station that has gone offline still has a
 * newest reading, so `stale` (the API's own freshness verdict) is what separates a live value from
 * the last thing the station managed to send before it dropped.
 */
export interface CurrentWeather {
  reading: WeatherData;
  stale: boolean;
  ageSeconds: number;
}
