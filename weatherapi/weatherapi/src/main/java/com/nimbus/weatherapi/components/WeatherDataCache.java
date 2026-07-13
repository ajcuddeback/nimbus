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
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Slf4j
@Component
public class WeatherDataCache {
    private final WeatherAggregator weatherAggregator;
    private final WeatherCachePersistenceService persistenceService;
    private final ConcurrentHashMap<String, List<WeatherRecord>> weatherDataMap = new ConcurrentHashMap<>();

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
     * Restores the weather cache from disk on startup. Records are age-filtered with the same
     * current/previous-hour rule that live entries use, so a stale block that was persisted (and
     * repeatedly re-stamped as "current hour" by the periodic persist) can never be re-admitted
     * to the in-memory cache and orphaned forever.
     */
    private void restoreCacheFromDisk() {
        persistenceService.loadCache().ifPresent(restoredData -> {
            restoredData.forEach((stationId, records) -> {
                final List<WeatherRecord> freshRecords = records.stream()
                        .filter(record -> belongsToCurrentOrPreviousHour(record.timestamp()))
                        .toList();

                final int dropped = records.size() - freshRecords.size();
                if (dropped > 0) {
                    log.warn("Dropped {} stale record(s) for station {} while restoring cache from disk", dropped, stationId);
                }

                if (!freshRecords.isEmpty()) {
                    weatherDataMap.computeIfAbsent(stationId, k -> new CopyOnWriteArrayList<>())
                            .addAll(freshRecords);
                }
            });
            log.info("Restored {} stations from disk cache", restoredData.size());
        });
    }

    public void addWeatherEntry(final String stationId, final WeatherRecord weatherRecord) {
        final long weatherTimestamp = weatherRecord.timestamp();
        if (!belongsToCurrentOrPreviousHour(weatherTimestamp)) {
            log.warn("Weather entry for {} does not belong to the current or previous hour - skipping",
                    Instant.ofEpochSecond(weatherTimestamp));
            return;
        }

        weatherDataMap.computeIfAbsent(stationId, k -> new CopyOnWriteArrayList<>()).add(weatherRecord);
    }

    /**
     * A record is retained only if it falls in the current or the immediately previous hour, so
     * readings that arrive slightly late or with minor clock skew near the hour boundary are not
     * dropped, while genuinely stale data is rejected. Used for both live ingestion and disk restore.
     */
    private boolean belongsToCurrentOrPreviousHour(final long weatherTimestamp) {
        final Instant recordHour = Instant.ofEpochSecond(weatherTimestamp).truncatedTo(ChronoUnit.HOURS);
        final Instant currentHour = Instant.now().truncatedTo(ChronoUnit.HOURS);
        final Instant previousHour = currentHour.minus(1, ChronoUnit.HOURS);
        return recordHour.equals(currentHour) || recordHour.equals(previousHour);
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
        final Instant now = Instant.now();
        final ZonedDateTime zonedDateTime = now.atZone(ZoneId.of("UTC"));
        final ZonedDateTime topOfCurrentHour = zonedDateTime.withMinute(0).withSecond(0).withNano(0);
        final Instant topOfCurrentHourInstant = topOfCurrentHour.toInstant();

        final Set<String> stationIds = getWeatherStationIds();

        stationIds.forEach(stationId -> {
            try {
                final List<WeatherRecord> weatherRecords = weatherDataMap.getOrDefault(stationId, new ArrayList<>());

                if (!weatherRecords.isEmpty()) {
                    // Aggregate everything from before the current hour (not just the last 60 minutes),
                    // so a record stamped exactly on an hour boundary can't slip below a now-minus-1h
                    // cutoff and become an un-aggregated, un-purged straggler.
                    final List<WeatherRecord> filteredRecords = weatherRecords.stream()
                            .filter(weatherRecord -> Instant.ofEpochSecond(weatherRecord.timestamp()).isBefore(topOfCurrentHourInstant))
                            .toList();

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
            } catch (Exception e) {
                // Isolate failures per station so one bad station can't abort the sweep for the rest.
                log.error("Failed to aggregate weather data for station {}", stationId, e);
            }
        });
    }
}
