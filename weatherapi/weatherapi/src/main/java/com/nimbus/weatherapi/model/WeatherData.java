package com.nimbus.weatherapi.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant;

@Document(collection = "weather_data")
public final class WeatherData {
    @Id
    private String id;
    private final double temp;
    private final String tempFormat;
    private final double hum;
    private final double pr;
    private final String prFormat;
    private final long timestamp;
    private final Coordinates coordinates;
    private final String stationName;

    public static final class Coordinates {
        private final String longitude;
        private final String latitude;

        public Coordinates(final String longitude, final String latitude) {
            this.longitude = longitude;
            this.latitude = latitude;
        }

        public String getLongitude() {
            return longitude;
        }

        public String getLatitude() {
            return latitude;
        }
    }

    public WeatherData(final double temp, final String tempFormat, final double hum, 
                      final double pr, final String prFormat, final long timestamp,
                      final Coordinates coordinates, final String stationName) {
        this.temp = temp;
        this.tempFormat = tempFormat;
        this.hum = hum;
        this.pr = pr;
        this.prFormat = prFormat;
        this.timestamp = timestamp;
        this.coordinates = coordinates;
        this.stationName = stationName;
    }

    // Getters
    public String getId() {
        return id;
    }

    public double getTemp() {
        return temp;
    }

    public String getTempFormat() {
        return tempFormat;
    }

    public double getHum() {
        return hum;
    }

    public double getPr() {
        return pr;
    }

    public String getPrFormat() {
        return prFormat;
    }

    public long getTimestamp() {
        return timestamp;
    }

    public Coordinates getCoordinates() {
        return coordinates;
    }

    public String getStationName() {
        return stationName;
    }
} 