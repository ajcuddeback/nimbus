package com.nimbus.weatherapi.service;

import com.nimbus.weatherapi.model.WeatherData;
import com.nimbus.weatherapi.repository.WeatherDataRepository;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
public final class WeatherDataService {
    private final WeatherDataRepository weatherDataRepository;

    public WeatherDataService(final WeatherDataRepository weatherDataRepository) {
        this.weatherDataRepository = weatherDataRepository;
    }

    public Mono<WeatherData> saveWeatherData(final WeatherData weatherData) {
        return weatherDataRepository.save(weatherData);
    }
} 