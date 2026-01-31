package com.nimbus.weatherapi.components;

import com.nimbus.weatherapi.model.WeatherRecord;
import com.nimbus.weatherapi.service.WeatherAggregator;
import com.nimbus.weatherapi.service.WeatherCachePersistenceService;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CopyOnWriteArrayList;

@Slf4j
@Component
public class WeatherDataCache {
    private final WeatherAggregator weatherAggregator;
    private final WeatherCachePersistenceService persistenceService;
    private final HashMap<String, List<WeatherRecord>> weatherDataMap = new HashMap<>();

    public WeatherDataCache(
            final WeatherAggregator weatherAggregator,
            final WeatherCachePersistenceService persistenceService
    ) {
        this.weatherAggregator = weatherAggregator;
        this.persistenceService = persistenceService;
    }

    @PostConstruct
    public void init() {
        restoreCacheFromDisk();
    }

    /**
     * Restores the weather cache from disk if it exists and is from the current hour.
     */
    private void restoreCacheFromDisk() {
        persistenceService.loadCache().ifPresent(restoredData -> {
            restoredData.forEach((stationId, records) -> {
                List<WeatherRecord> stationList = weatherDataMap.computeIfAbsent(
                        stationId, k -> new CopyOnWriteArrayList<>()
                );
                stationList.addAll(records);
            });
            log.info("Restored {} stations from disk cache", restoredData.size());
        });
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

    /**
     * Persists the weather cache to disk every minute for crash recovery.
     */
    @Scheduled(cron = "0 * * * * *")
    public void persistCacheToDisk() {
        if (!weatherDataMap.isEmpty()) {
            log.debug("Persisting weather cache to disk");
            persistenceService.persistCache(weatherDataMap);
        }
    }

    @Scheduled(cron = "0 0 * * * *")
    public void aggregateHourly() {
        log.info("Running hourly aggregation");
        persistenceService.deleteCache();
        final Instant cutoffStart = Instant.now().minus(1, ChronoUnit.HOURS);
        final Instant now = Instant.now();
        final ZonedDateTime zonedDateTime = now.atZone(ZoneId.of("UTC"));
        final ZonedDateTime topOfCurrentHour = zonedDateTime.withMinute(0).withSecond(0).withNano(0);
        final Instant topOfCurrentHourInstant = topOfCurrentHour.toInstant();

        final Set<String> stationIds = getWeatherStationIds();

        stationIds.forEach(stationId -> {
            final List<WeatherRecord> weatherRecords = weatherDataMap.getOrDefault(stationId, new ArrayList<>());

            if (!weatherRecords.isEmpty()) {
                List<WeatherRecord> filteredRecords = weatherRecords.stream().filter(weatherRecord -> !Instant.ofEpochSecond(weatherRecord.timestamp()).isBefore(cutoffStart) ||
                        !Instant.ofEpochSecond(weatherRecord.timestamp()).isAfter(topOfCurrentHourInstant)).toList();

                this.weatherAggregator.aggregateWeather(stationId, filteredRecords)
                        .retryWhen(
                                Retry.backoff(
                                        3,
                                        Duration.ofSeconds(1)
                                )
                                        .filter(err -> {
                                            if (err instanceof DuplicateKeyException) {
                                                log.warn("Failed to save weather data. Unique constraint failed.");
                                                return false;
                                            }

                                            return true;
                                        })
                        )
                        .doOnError(e -> log.error("All attempts to save weather data failed. Flushing cache...", e))
                        .doFinally(v -> this.flushWeatherCache(stationId))
                        .subscribe(
                        weatherDataResponse -> {
                            log.info("Successfully created weather data entry with id {}", weatherDataResponse.getId());
                        },
                        err -> {
                            log.error("Failed to save weather data", err);
                        }
                );
            }
        });
    }
}
