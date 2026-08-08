package com.nimbus.weatherapi.model;

import lombok.Getter;
import lombok.ToString;

/**
 * Read-time, hourly-aggregated weather view. This is no longer persisted; it is computed on the fly
 * by aggregating the raw minute records from the {@code weather_data_series} time-series collection.
 * The {@code timestamp} is the epoch-second start of the aggregated hour (UTC), preserving the shape
 * the frontend previously consumed from the old {@code weather_data} collection.
 */
@Getter
@ToString
public final class WeatherData {
    private final double temp;
    private final String tempFormat;
    private final double hum;
    private final double pr;
    private final String prFormat;
    private final double windDirection;
    private final double windSpeed;
    private final String windSpeedFormat;
    private final double rainfall;
    private final String rainfallFormat;
    private final long timestamp;
    private final String stationId;

    public WeatherData(final double temp, final String tempFormat, final double hum,
                      final double pr, final String prFormat, final double windDirection, final double windSpeed,
                      final String windSpeedFormat, final double rainfall, final String rainfallFormat,
                       final long timestamp, final String stationId) {
        this.temp = temp;
        this.tempFormat = tempFormat;
        this.hum = hum;
        this.pr = pr;
        this.prFormat = prFormat;
        this.windDirection = windDirection;
        this.windSpeed = windSpeed;
        this.windSpeedFormat = windSpeedFormat;
        this.rainfall = rainfall;
        this.rainfallFormat = rainfallFormat;
        this.timestamp = timestamp;
        this.stationId = stationId;
    }

}