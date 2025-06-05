package com.nimbus.weatherapi.model;

import lombok.Getter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Getter
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

    public record Coordinates(double longitude, double latitude) { }

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