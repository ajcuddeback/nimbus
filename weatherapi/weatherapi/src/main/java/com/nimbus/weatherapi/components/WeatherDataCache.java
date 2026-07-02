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

import java.time.*;
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
        final long weatherTimestamp = weatherRecord.timestamp();
        final Instant weatherTimestampInstant = Instant.ofEpochSecond(weatherTimestamp);
        final Instant recordHour = weatherTimestampInstant.truncatedTo(ChronoUnit.HOURS);
        final Instant currentHour = Instant.now().truncatedTo(ChronoUnit.HOURS);
        final Instant previousHour = currentHour.minus(1, ChronoUnit.HOURS);
        // Accept the current hour or the immediately previous hour, so readings that arrive
        // slightly late or with minor clock skew near the hour boundary are not dropped.
        if (!recordHour.equals(currentHour) && !recordHour.equals(previousHour)) {
            log.warn("Weather entry for {} does not belong to the current or previous hour - skipping", weatherTimestampInstant);
            return;
        }

        weatherDataMap.computeIfAbsent(stationId, k -> new CopyOnWriteArrayList<>()).add(weatherRecord);
    }

    public List<WeatherRecord> getWeatherData(final String stationId) {
        return weatherDataMap.getOrDefault(stationId, new ArrayList<>());
    }

    /**
     * Removes only the records that were included in an aggregation batch, preserving any
     * newer records that arrived after the batch snapshot was taken (e.g. entries for the
     * new hour that came in while the async aggregation was still retrying).
     */
    private void removeAggregatedRecords(final String stationId, final List<WeatherRecord> aggregatedRecords) {
        final List<WeatherRecord> stationList = weatherDataMap.get(stationId);
        if (stationList != null) {
            stationList.removeAll(aggregatedRecords);
        }
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
                final List<WeatherRecord> filteredRecords = weatherRecords.stream().filter(weatherRecord -> !Instant.ofEpochSecond(weatherRecord.timestamp()).isBefore(cutoffStart) &&
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
                        .doFinally(v -> this.removeAggregatedRecords(stationId, filteredRecords))
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
