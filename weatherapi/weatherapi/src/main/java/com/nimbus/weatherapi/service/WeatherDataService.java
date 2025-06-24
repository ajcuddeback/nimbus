package com.nimbus.weatherapi.service;

import com.nimbus.weatherapi.model.WeatherData;
import com.nimbus.weatherapi.repository.WeatherDataRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public final class WeatherDataService {
    private final WeatherDataRepository weatherDataRepository;

    public WeatherDataService(final WeatherDataRepository weatherDataRepository) {
        this.weatherDataRepository = weatherDataRepository;
    }

    public void saveWeatherData(final WeatherData weatherData) {
        weatherDataRepository.save(weatherData)
                .subscribe(
                        weatherDataResponse -> {
                            log.info("Successfully created weather data entry with id {}", weatherDataResponse.getId());
                        },
                        err -> {
                            if (err instanceof DuplicateKeyException) {
                                log.warn("Failed to save weather data. Unique constraint failed for {}", weatherData);
                                return;
                            }
                            log.error("Failed to save weather data", err);
                        }
                );

    }
} 