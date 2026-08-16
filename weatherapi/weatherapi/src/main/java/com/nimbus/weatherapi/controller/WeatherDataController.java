package com.nimbus.weatherapi.controller;

import com.nimbus.weatherapi.model.CurrentWeather;
import com.nimbus.weatherapi.model.WeatherData;
import com.nimbus.weatherapi.model.WeatherRecord;
import com.nimbus.weatherapi.service.WeatherDataService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.DateTimeException;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

@RestController
@RequestMapping("/weatherData")
public class WeatherDataController {

    /**
     * Widest window {@code GET /weatherData} will serve. The dashboard asks for a single day; the
     * cap exists so a hand-rolled request cannot walk the whole minute series in one aggregation.
     */
    private static final Duration MAX_RANGE = Duration.ofDays(31);

    private final WeatherDataService weatherDataService;

    public WeatherDataController(WeatherDataService weatherDataService) {
        this.weatherDataService = weatherDataService;
    }

    /**
     * Hourly aggregates between two epoch-second bounds, bucketed into hours of the caller's
     * timezone. {@code from} is inclusive and {@code to} is exclusive, so a single local day is
     * requested as midnight through the next midnight — which stays exact on the 23- and 25-hour
     * days that daylight saving produces.
     */
    @GetMapping()
    public Flux<WeatherData> getWeatherForRange(
            @RequestParam String stationId,
            @RequestParam String timezone,
            @RequestParam Long from,
            @RequestParam Long to
    ) {
        final ZoneId zone = parseZone(timezone);
        final Instant fromInstant = Instant.ofEpochSecond(from);
        final Instant toInstant = Instant.ofEpochSecond(to);

        if (!fromInstant.isBefore(toInstant)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "'from' must be before 'to'");
        }
        if (Duration.between(fromInstant, toInstant).compareTo(MAX_RANGE) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Range is longer than the " + MAX_RANGE.toDays() + " day maximum");
        }

        return weatherDataService.getWeatherInRange(stationId, zone.getId(), fromInstant, toInstant);
    }

    /**
     * The single most recent minute reading for a station, tagged with its age so callers can tell a
     * live reading from the last thing an offline station happened to send. Empty when the station
     * has never reported.
     */
    @GetMapping("/current")
    public Mono<CurrentWeather> getCurrentWeather(
            @RequestParam String stationId
    ) {
        return weatherDataService.getCurrentWeather(stationId);
    }

    /**
     * Raw minute readings for the current hour, in the caller's timezone.
     */
    @GetMapping("/hour")
    public Flux<WeatherRecord> getCurrentHourWeather(
            @RequestParam String stationId,
            @RequestParam String timezone
    ) {
        return weatherDataService.getCurrentHourWeather(stationId, parseZone(timezone).getId());
    }

    /**
     * Today's hourly aggregates in the caller's timezone: local midnight up to, but not including,
     * tomorrow's local midnight. Both bounds come from {@link LocalDate#atStartOfDay(ZoneId)}, which
     * resolves the days where midnight itself is skipped or repeated by a daylight-saving shift.
     */
    @GetMapping("/today")
    public Flux<WeatherData> getTodaysWeather(
            @RequestParam String stationId,
            @RequestParam String timezone
    ) {
        final ZoneId zone = parseZone(timezone);
        final LocalDate today = LocalDate.now(zone);
        final Instant startOfDay = today.atStartOfDay(zone).toInstant();
        final Instant startOfNextDay = today.plusDays(1).atStartOfDay(zone).toInstant();

        return weatherDataService.getWeatherInRange(stationId, zone.getId(), startOfDay, startOfNextDay);
    }

    /**
     * The timezone arrives from the browser, so an unknown id is a bad request rather than a
     * server fault — and rejecting it here keeps a junk value from reaching {@code $dateTrunc},
     * where it would surface as an opaque aggregation error.
     */
    private static ZoneId parseZone(final String timezone) {
        try {
            return ZoneId.of(timezone);
        } catch (final DateTimeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown timezone: " + timezone);
        }
    }
}
