package com.nimbus.weatherapi.controller;

import com.nimbus.weatherapi.model.WeatherData;
import com.nimbus.weatherapi.service.WeatherDataService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/report")
public class WeatherReportsController {
    private final WeatherDataService weatherDataService;

    public WeatherReportsController(WeatherDataService weatherDataService) {
        this.weatherDataService = weatherDataService;
    }

    @GetMapping
    public Mono<Page<WeatherData>> getWeatherDataByLocation(
            @RequestParam String stationId,
            Pageable pageable
    ) {
        return weatherDataService.getWeatherDataByLocation(stationId, pageable);
    }
}
