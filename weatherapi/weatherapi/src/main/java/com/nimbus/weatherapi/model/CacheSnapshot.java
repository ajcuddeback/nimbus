package com.nimbus.weatherapi.model;

import java.util.List;
import java.util.Map;

/**
 * Represents a snapshot of the weather data cache for disk persistence.
 * Contains the hour timestamp to ensure we only restore data from the current hour.
 */
public record CacheSnapshot(
        long hourTimestamp,
        Map<String, List<WeatherRecord>> weatherData
) {
}
