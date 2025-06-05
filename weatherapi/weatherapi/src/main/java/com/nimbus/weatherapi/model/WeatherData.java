package com.nimbus.weatherapi.model;

import lombok.Getter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant;

@Getter
@Document(collection = "weather_data")
public final class WeatherData {
    // Getters
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

    @Getter
    public static final class Coordinates {
        private final double longitude;
        private final double latitude;

        public Coordinates(final double longitude, final double latitude) {
            this.longitude = longitude;
            this.latitude = latitude;
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

}