package com.nimbus.weatherapi.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nimbus.weatherapi.model.CacheSnapshot;
import com.nimbus.weatherapi.model.WeatherRecord;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
public class WeatherCachePersistenceService {

    private final ObjectMapper objectMapper;
    private final Path cacheFilePath;

    public WeatherCachePersistenceService(
            ObjectMapper objectMapper,
            @Value("${weather.cache.file-path:./weather-cache.json}") String cacheFilePath
    ) {
        this.objectMapper = objectMapper;
        this.cacheFilePath = Path.of(cacheFilePath);
    }

    /**
     * Persists the weather cache to disk with the current hour timestamp.
     *
     * @param weatherData the current in-memory cache data
     */
    public void persistCache(Map<String, List<WeatherRecord>> weatherData) {
        try {
            long currentHourTimestamp = getCurrentHourTimestamp();
            CacheSnapshot snapshot = new CacheSnapshot(currentHourTimestamp, new HashMap<>(weatherData));

            String json = objectMapper.writeValueAsString(snapshot);
            Files.writeString(cacheFilePath, json);

            log.debug("Successfully persisted weather cache to disk with {} stations", weatherData.size());
        } catch (IOException e) {
            log.error("Failed to persist weather cache to disk", e);
        }
    }

    /**
     * Loads the weather cache from disk if it exists and is from the current hour.
     *
     * @return Optional containing the cache data if valid, empty otherwise
     */
    public Optional<Map<String, List<WeatherRecord>>> loadCache() {
        if (!Files.exists(cacheFilePath)) {
            log.info("No cache file found at {}", cacheFilePath);
            return Optional.empty();
        }

        try {
            String json = Files.readString(cacheFilePath);
            CacheSnapshot snapshot = objectMapper.readValue(json, CacheSnapshot.class);

            long currentHourTimestamp = getCurrentHourTimestamp();

            if (snapshot.hourTimestamp() != currentHourTimestamp) {
                log.info("Cache file is from a different hour (cache: {}, current: {}), discarding",
                        snapshot.hourTimestamp(), currentHourTimestamp);
                deleteCache();
                return Optional.empty();
            }

            log.info("Successfully restored weather cache from disk with {} stations",
                    snapshot.weatherData().size());
            return Optional.of(snapshot.weatherData());

        } catch (IOException e) {
            log.error("Failed to load weather cache from disk", e);
            return Optional.empty();
        }
    }

    /**
     * Deletes the cache file from disk.
     */
    public void deleteCache() {
        try {
            if (Files.exists(cacheFilePath)) {
                Files.delete(cacheFilePath);
                log.debug("Deleted weather cache file");
            }
        } catch (IOException e) {
            log.error("Failed to delete weather cache file", e);
        }
    }

    /**
     * Gets the timestamp representing the start of the current hour in UTC.
     */
    private long getCurrentHourTimestamp() {
        Instant now = Instant.now();
        ZonedDateTime zonedDateTime = now.atZone(ZoneId.of("UTC"));
        ZonedDateTime topOfCurrentHour = zonedDateTime.withMinute(0).withSecond(0).withNano(0);
        return topOfCurrentHour.toEpochSecond();
    }
}
