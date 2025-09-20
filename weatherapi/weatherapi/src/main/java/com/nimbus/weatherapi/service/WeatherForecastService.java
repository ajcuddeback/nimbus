package com.nimbus.weatherapi.service;

import com.nimbus.weatherapi.model.forecast.OpenWeatherForecast;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Service
public class WeatherForecastService {
    private final WebClient webClient;

    @Value("${openweather.api-key}")
    private String apiKey;

    public WeatherForecastService(WebClient.Builder builder) {
        this.webClient = builder.baseUrl("api.openweathermap.org").build();
    }

    public Mono<OpenWeatherForecast> getWeatherForecast(final double lon, final double lat) {
        return webClient.get()
                .uri("/data/2.5/forecast?lon=" + lon + "&lat=" + lat + "&appid=" + apiKey)
                .retrieve()
                .bodyToMono(OpenWeatherForecast.class);
    }
}
