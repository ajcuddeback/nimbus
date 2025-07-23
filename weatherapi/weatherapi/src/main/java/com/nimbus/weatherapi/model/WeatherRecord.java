package com.nimbus.weatherapi.model;

public record WeatherRecord(
        double temp,
        String tempFormat,
        double hum,
        double pr,
        String prFormat,
        double windDirection,
        double windSpeed,
        String windSpeedFormat,
        double rainfall,
        String rainfallFormat,
        long timestamp,
        String stationId
) {
}
