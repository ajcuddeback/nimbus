package com.nimbus.weatherapi.service;

import com.nimbus.weatherapi.model.WeatherData;
import com.nimbus.weatherapi.model.WeatherRecord;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.List;

@Slf4j
@Service
public class WeatherAggregator {
    private final WeatherDataService weatherDataService;

    public WeatherAggregator(final WeatherDataService weatherDataService) {
        this.weatherDataService = weatherDataService;
    }

    public Mono<WeatherData> aggregateWeather(final String stationId, final List<WeatherRecord> weatherRecords) {
        if (weatherRecords.isEmpty()) {
            log.warn("No weather records found!");
            return Mono.empty();
        }

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
                stationId
        );

        return weatherDataService.saveWeatherData(weatherData);
    }

    private double aggregateWindDirection(final List<Double> windDirections) {
        final double[] sinSum = {0d};
        final double[] cosSum = {0d};

        windDirections.forEach(windDirection -> {
            final double r = Math.toRadians(windDirection);
            sinSum[0] += Math.sin(r);
            cosSum[0] += Math.cos(r);
        });

        final double flen = windDirections.size();

        final double s = sinSum[0] / flen;
        final double c = cosSum[0] / flen;

        final double arc = Math.toDegrees(Math.atan(s / c));

        double average = 0d;

        if (s > 0 && c > 0) {
            average = arc;
        } else if (c < 0) {
            average = arc + 180d;
        } else if (s < 0 && c > 0) {
            average = arc + 360d;
        }

        return roundToNearestHundredths(average == 360 ? 0d : average);
    }

    private double aggregateRainfall(final List<Double> rainfalls){
        return roundToNearestHundredths(rainfalls.stream().reduce(0d, Double::sum));
    }

    private double aggregateWindSpeed(final List<Double> windSpeeds){
        final int windSpeedsLength = windSpeeds.size();

        final double windSpeedTotals = windSpeeds.stream().reduce(0d, Double::sum);

        return roundToNearestHundredths(windSpeedTotals / windSpeedsLength);
    }

    private double aggregateTemp(final List<Double> temps) {
        final int tempsLength = temps.size();

        final double tempTotals = temps.stream().reduce(0d, Double::sum);

        return roundToNearestHundredths(tempTotals / tempsLength);
    }

    private double aggregateHumidity(final List<Double> humidities) {
        final int humiditiesLength = humidities.size();

        final double humidityTotals = humidities.stream().reduce(0d, Double::sum);

        return roundToNearestHundredths(humidityTotals / humiditiesLength);
    }

    private double aggregatePressure(final List<Double> pressures) {
        final int pressuresLength = pressures.size();

        final double pressureTotals = pressures.stream().reduce(0d, Double::sum);

        return roundToNearestHundredths(pressureTotals / pressuresLength);
    }

    private double roundToNearestHundredths(final double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
