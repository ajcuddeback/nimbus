package com.nimbus.weatherapi.controller;

import com.nimbus.weatherapi.model.WeatherData;
import com.nimbus.weatherapi.service.WeatherDataService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;
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

    @GetMapping("/current")
    public Mono<WeatherData> getLatestWeatherData(
            @RequestParam String stationId
    ) {
        return weatherDataService.getLatestWeatherData(stationId);
    }
}
