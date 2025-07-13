export interface WeatherData {
  temp: number;
  tempFormat: string;
  hum: number;
  pr: number;
  prFormat: string;
  timestamp: number;
  stationId: string;
  id: string;
  windDirection: string;
  windSpeed: number;
  windSpeedFormat: string;
  rainfall: number;
  rainfallFormat: string;
}
