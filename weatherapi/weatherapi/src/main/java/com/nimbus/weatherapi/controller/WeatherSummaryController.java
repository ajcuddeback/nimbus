package com.nimbus.weatherapi.controller;

import com.nimbus.weatherapi.components.WeatherSummaryCache;
import com.nimbus.weatherapi.model.llm.WeatherSummary;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@Slf4j
@RestController
@RequestMapping("/weatherSummary")
public class WeatherSummaryController {
    private final WeatherSummaryCache weatherSummaryCache;

    public WeatherSummaryController(
            final WeatherSummaryCache weatherSummaryCache
    ) {
        this.weatherSummaryCache = weatherSummaryCache;
    }

    @GetMapping
    public Mono<WeatherSummary> fetchCurrentWeatherSummary(
            @RequestParam String stationId
    ) {
        final WeatherSummary aiSummary = weatherSummaryCache.getAISummary(stationId);
        log.info("Ai summary is: {}", aiSummary.summary());
        return Mono.just(aiSummary);
    }
}
