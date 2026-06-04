package com.nimbus.weatherapi.service;

import com.nimbus.weatherapi.model.Assistant;
import com.nimbus.weatherapi.model.WeatherRecord;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;

@Service
@Slf4j
public class WeatherSummaryService {
    @Autowired
    private Assistant assistant;

    public Flux<String> getSummary(final WeatherRecord weatherData) {
        return assistant.getWeatherSummary(
                ZonedDateTime.now(ZoneId.of("America/New_York")).format(DateTimeFormatter.ISO_DATE_TIME),
                String.valueOf(weatherData.temp()),
                String.valueOf(weatherData.hum()),
                String.valueOf(weatherData.windSpeed())
        );

    }
}
