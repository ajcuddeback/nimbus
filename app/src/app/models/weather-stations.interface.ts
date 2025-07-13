export interface WeatherStation {
  stationName: string;
  stationId: string;
  id: string;
  location: Location;
}

export interface Location {
  x: number;
  y: number;
  type: string;
  coordinates: number[];
}
