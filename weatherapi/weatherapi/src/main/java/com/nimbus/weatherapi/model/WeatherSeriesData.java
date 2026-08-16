package com.nimbus.weatherapi.model;

import lombok.Getter;
import lombok.ToString;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.PersistenceCreator;
import org.springframework.data.mongodb.core.mapping.TimeSeries;
import org.springframework.data.mongodb.core.timeseries.Granularity;

import java.time.Instant;

/**
 * Raw, minute-by-minute weather reading stored in the MongoDB time-series collection
 * {@code weather_data_series}. The {@code timestamp} is the time-series {@code timeField}
 * (a BSON Date) and {@code stationId} is the {@code metaField}. Granularity is one minute.
 * <p>
 * Time-series collections cannot enforce a unique index, so duplicate readings (e.g. from
 * MQTT QoS-1 redelivery) are guarded best-effort on write and always de-duplicated on read.
 */
@Getter
@ToString
@TimeSeries(collection = "weather_data_series", timeField = "timestamp", metaField = "stationId", granularity = Granularity.MINUTES)
public final class WeatherSeriesData {
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
    private final Instant timestamp;
    private final String stationId;

    @PersistenceCreator
    public WeatherSeriesData(final double temp, final String tempFormat, final double hum,
                             final double pr, final String prFormat, final double windDirection, final double windSpeed,
                             final String windSpeedFormat, final double rainfall, final String rainfallFormat,
                             final Instant timestamp, final String stationId) {

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
