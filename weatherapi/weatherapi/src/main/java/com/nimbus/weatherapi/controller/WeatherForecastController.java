package com.nimbus.weatherapi.controller;

import com.nimbus.weatherapi.model.forecast.OpenWeatherForecast;
import com.nimbus.weatherapi.service.WeatherForecastService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/forecast")
public class WeatherForecastController {
    private final WeatherForecastService weatherForecastService;
    public WeatherForecastController(WeatherForecastService weatherForecastService) {
        this.weatherForecastService = weatherForecastService;
    }


    @GetMapping
    public Mono<OpenWeatherForecast> getWeatherStationsByLocation(
            @RequestParam Double lon,
            @RequestParam Double lat
    ) {
        return weatherForecastService.getWeatherForecast(lon, lat);
    }
}
