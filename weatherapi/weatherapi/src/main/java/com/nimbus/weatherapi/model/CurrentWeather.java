package com.nimbus.weatherapi.model;

/**
 * The station's most recent reading, wrapped with how old it actually is.
 * <p>
 * A station that has gone offline still has a "most recent" reading, and returning it bare invites
 * callers to render hours-old values as if they were live. {@code ageSeconds} is the gap between the
 * reading's timestamp and now, and {@code stale} is that age measured against the configured
 * freshness window ({@code weather.current.stale-after}), so the decision lives in one place instead
 * of being re-derived by every consumer.
 */
public record CurrentWeather(
        WeatherRecord reading,
        boolean stale,
        long ageSeconds
) {
}
