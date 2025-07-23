package com.nimbus.weatherapi.service;

import com.nimbus.weatherapi.model.WeatherData;
import com.nimbus.weatherapi.model.WeatherRecord;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class WeatherAggregator {
    private final WeatherDataService weatherDataService;

    public WeatherAggregator(final WeatherDataService weatherDataService) {
        this.weatherDataService = weatherDataService;
    }

    public void aggregateWeather(final List<WeatherRecord> weatherRecords) {
        final double averageWindDirection = aggregateWindDirection(
                weatherRecords.stream().map(WeatherRecord::windDirection).toList()
        );

        final double totalRainfall = aggregateRainfall(
                weatherRecords.stream().map(WeatherRecord::rainfall).toList()
        );

        final double averageWindSpeed = aggregateWindSpeed(
                weatherRecords.stream().map(WeatherRecord::windSpeed).toList()
        );

        final double averageTemp = aggregateTemp(
                weatherRecords.stream().map(WeatherRecord::temp).toList()
        );

        final double averageHumidity = aggregateHumidity(
                weatherRecords.stream().map(WeatherRecord::hum).toList()
        );

        final double averagePressure = aggregatePressure(
                weatherRecords.stream().map(WeatherRecord::pr).toList()
        );

        final WeatherData weatherData = new WeatherData(
                averageTemp,
                weatherRecords.getFirst().tempFormat(),
                averageHumidity,
                averagePressure,
                weatherRecords.getFirst().prFormat(),
                averageWindDirection,
                averageWindSpeed,
                weatherRecords.getFirst().windSpeedFormat(),
                totalRainfall,
                weatherRecords.getFirst().rainfallFormat(),
                Instant.now().getEpochSecond(),
                weatherRecords.getFirst().stationId()
        );

        weatherDataService.saveWeatherData(weatherData);
    }

    private double aggregateWindDirection(final List<Double> windDirections) {

    }

    private double aggregateRainfall(final List<Double> rainfalls){

    }

    private double aggregateWindSpeed(final List<Double> windSpeeds){

    }

    private double aggregateTemp(final List<Double> temps) {

    }

    private double aggregateHumidity(final List<Double> humidities) {

    }

    private double aggregatePressure(final List<Double> pressures) {

    }

}
