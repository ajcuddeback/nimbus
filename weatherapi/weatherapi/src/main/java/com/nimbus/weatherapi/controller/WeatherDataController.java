package com.nimbus.weatherapi.controller;

import com.nimbus.weatherapi.cache.WeatherDataCache;
import com.nimbus.weatherapi.model.WeatherData;
import com.nimbus.weatherapi.model.WeatherRecord;
import com.nimbus.weatherapi.service.WeatherDataService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

@RestController
@RequestMapping("/weatherData")
public class WeatherDataController {
    private final WeatherDataService weatherDataService;
    private final WeatherDataCache weatherDataCache;

    public WeatherDataController(
            WeatherDataService weatherDataService,
            WeatherDataCache weatherDataCache
    ) {
        this.weatherDataService = weatherDataService;
        this.weatherDataCache = weatherDataCache;
    }

    // TODO: Can probably go away? Pageability coule be useful in history API though - based on filter range
    @GetMapping
    public Mono<Page<WeatherData>> getWeatherDataByLocation(
            @RequestParam String stationId,
            Pageable pageable
    ) {
        return weatherDataService.getWeatherDataByLocation(stationId, pageable);
    }

    // TODO: To be changed to this minute - not this hour?
    @GetMapping("/current")
    public Mono<List<WeatherRecord>> getLatestWeatherData(
            @RequestParam String stationId
    ) {
        return Mono.just(weatherDataCache.getWeatherData(stationId));
    }


    // TODO: To be changed to history
    @GetMapping("/today")
    public Flux<WeatherData> getTodaysWeather(
            @RequestParam String stationId,
            @RequestParam String timezone
    ) {
        return weatherDataService.getTodaysWeather(stationId, timezone);
    }
}
