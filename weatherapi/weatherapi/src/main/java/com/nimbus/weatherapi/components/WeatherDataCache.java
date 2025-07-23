package com.nimbus.weatherapi.components;

import com.nimbus.weatherapi.model.WeatherRecord;
import com.nimbus.weatherapi.service.WeatherAggregator;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Set;
import java.util.concurrent.CopyOnWriteArrayList;

@Component
public class WeatherDataCache {
    final WeatherAggregator weatherAggregator;
    private final HashMap<String, List<WeatherRecord>> weatherDataMap = new HashMap<>();

    public WeatherDataCache(final WeatherAggregator weatherAggregator) {
        this.weatherAggregator = weatherAggregator;
    }

    public void addWeatherEntry(final String stationId, final WeatherRecord weatherRecord) {
        weatherDataMap.computeIfAbsent(stationId, k -> new CopyOnWriteArrayList<>()).add(weatherRecord);
    }

    public List<WeatherRecord> getWeatherData(final String stationId) {
        return weatherDataMap.getOrDefault(stationId, new ArrayList<>());
    }

    public void flushWeatherCache(final String stationId) {
        weatherDataMap.get(stationId).clear();
    }

    public Set<String> getWeatherStationIds() {
        return weatherDataMap.keySet();
    }

    @Scheduled(cron = "0 0 0 * * *")
    public void aggregateHourly() {
        final Instant cutoffStart = Instant.now().minus(1, ChronoUnit.HOURS);
        final Instant now = Instant.now();
        final ZonedDateTime zonedDateTime = now.atZone(ZoneId.of("UTC"));
        final ZonedDateTime topOfCurrentHour = zonedDateTime.withMinute(0).withSecond(0).withNano(0);
        final Instant topOfCurrentHourInstant = topOfCurrentHour.toInstant();

        getWeatherStationIds().stream().map(this::getWeatherData)
                .filter(weatherDataList -> !weatherDataList.isEmpty())
                .forEach(weatherDataList -> {
                    List<WeatherRecord> filteredRecords = weatherDataList.stream().filter(weatherRecord -> !Instant.ofEpochSecond(weatherRecord.timestamp()).isBefore(cutoffStart) &&
                                !Instant.ofEpochSecond(weatherRecord.timestamp()).isAfter(topOfCurrentHourInstant)).toList();

                    this.weatherAggregator.aggregateWeather(filteredRecords);
                });
    }
}
