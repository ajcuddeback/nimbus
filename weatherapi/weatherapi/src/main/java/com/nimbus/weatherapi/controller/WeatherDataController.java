package com.nimbus.weatherapi.controller;

import com.nimbus.weatherapi.model.Location;
import com.nimbus.weatherapi.model.WeatherData;
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

    @GetMapping("/locations")
    public Flux<Location> getLocations(
            @RequestParam String lon,
            @RequestParam String lat,
            @RequestParam(defaultValue = "1000") int maxDistance
    ) {
        return this.weatherDataService.getLocations(lon, lat, maxDistance);
    }

    @GetMapping
    public Mono<Page<WeatherData>> getWeatherDataByLocation(
            @RequestParam String stationName,
            Pageable pageable
    ) {
        return weatherDataService.getWeatherDataByLocation(stationName, pageable);
    }
}
