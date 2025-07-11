package com.nimbus.weatherapi.controller;

import com.nimbus.weatherapi.model.WeatherData;
import com.nimbus.weatherapi.model.WeatherStations;
import com.nimbus.weatherapi.service.WeatherStationsService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/weatherStations")
public class WeatherStationsController {
    private final WeatherStationsService weatherStationsService;
    public WeatherStationsController(WeatherStationsService weatherStationsService) {
        this.weatherStationsService = weatherStationsService;
    }


    @GetMapping
    public Mono<Page<WeatherStations>> getWeatherStationsByLocation(
            @RequestParam Double lon,
            @RequestParam Double lat,
            @RequestParam(defaultValue = "1000") Double maxDistance,
            Pageable pageable
    ) {
        return weatherStationsService.getWeatherStationsByLocation(lon, lat, maxDistance, pageable);
    }
}
