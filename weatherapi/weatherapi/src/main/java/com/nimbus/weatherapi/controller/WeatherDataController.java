package com.nimbus.weatherapi.controller;

import com.nimbus.weatherapi.model.CurrentWeather;
import com.nimbus.weatherapi.model.WeatherData;
import com.nimbus.weatherapi.model.WeatherRecord;
import com.nimbus.weatherapi.service.WeatherDataService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;

@RestController
@RequestMapping("/weatherData")
public class WeatherDataController {
    private final WeatherDataService weatherDataService;

    public WeatherDataController(WeatherDataService weatherDataService) {
        this.weatherDataService = weatherDataService;
    }

    @GetMapping()
    public Flux<WeatherData> getWeatherForRange(
            @RequestParam String stationId,
            @RequestParam String timezone,
            @RequestParam Long from,
            @RequestParam Long to
    ) {
        final Instant fromInstant = Instant.ofEpochSecond(from);
        final Instant toInstant = Instant.ofEpochSecond(to);
        return weatherDataService.getWeatherInRange(stationId, timezone, fromInstant, toInstant);
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
        return weatherDataService.getCurrentHourWeather(stationId, timezone);
    }

    @GetMapping("/today")
    public Flux<WeatherData> getTodaysWeather(
            @RequestParam String stationId,
            @RequestParam String timezone
    ) {
        final ZoneId zone = ZoneId.of(timezone);
        final ZonedDateTime now = ZonedDateTime.now(zone);
        final Instant startOfDay = now.withHour(0).withMinute(0).withSecond(0).withNano(0).toInstant();
        final Instant endOfDay = now.withHour(23).withMinute(59).withSecond(59).withNano(999_999_999).toInstant();
        return weatherDataService.getWeatherInRange(stationId, timezone, startOfDay, endOfDay);
    }


}
