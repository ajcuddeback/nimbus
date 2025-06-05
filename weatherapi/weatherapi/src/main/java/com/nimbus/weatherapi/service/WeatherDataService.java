package com.nimbus.weatherapi.service;

import com.nimbus.weatherapi.model.WeatherData;
import com.nimbus.weatherapi.repository.WeatherDataRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Slf4j
@Service
public final class WeatherDataService {
    private final WeatherDataRepository weatherDataRepository;

    public WeatherDataService(final WeatherDataRepository weatherDataRepository) {
        this.weatherDataRepository = weatherDataRepository;
    }

    public void saveWeatherData(final WeatherData weatherData) {
        weatherDataRepository.save(weatherData)
                .doOnError(err -> {
                    log.error("Failed to save weather data", err);
                })
                .doOnSuccess(weatherDataResponse -> {
                    log.info("Successfully created weather data entry with id {}", weatherDataResponse.getId());
                }).subscribe();
    }
} 