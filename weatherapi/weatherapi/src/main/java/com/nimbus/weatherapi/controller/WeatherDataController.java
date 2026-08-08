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

@RestController
@RequestMapping("/weatherData")
public class WeatherDataController {
    private final WeatherDataService weatherDataService;

    public WeatherDataController(WeatherDataService weatherDataService) {
        this.weatherDataService = weatherDataService;
    }

    @GetMapping
    public Mono<Page<WeatherData>> getWeatherDataByLocation(
            @RequestParam String stationId,
            Pageable pageable
    ) {
        return weatherDataService.getWeatherDataByLocation(stationId, pageable);
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
        return weatherDataService.getTodaysWeather(stationId, timezone);
    }
}
