package com.nimbus.weatherapi.components;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nimbus.weatherapi.model.WeatherStations;
import com.nimbus.weatherapi.model.llm.WeatherSummary;
import com.nimbus.weatherapi.service.WeatherDataService;
import com.nimbus.weatherapi.service.WeatherStationsService;
import com.nimbus.weatherapi.service.WeatherSummaryService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Component
public class WeatherSummaryCache {
    private final Map<String, WeatherSummary> currentWeatherSummary = new HashMap<>();
    private final WeatherDataService weatherDataService;
    private final WeatherSummaryService weatherSummaryService;
    private final WeatherStationsService weatherStationsService;

    public WeatherSummaryCache(
            WeatherDataService weatherDataService,
            WeatherSummaryService weatherSummaryService,
            WeatherStationsService weatherStationsService
    ) {
        this.weatherDataService = weatherDataService;
        this.weatherSummaryService = weatherSummaryService;
        this.weatherStationsService = weatherStationsService;
    }
    private final ObjectMapper mapper = new ObjectMapper();


    public final WeatherSummary getAISummary(final String stationId) {
        return this.currentWeatherSummary.getOrDefault(stationId, new WeatherSummary("No summary available yet", "info"));
    }

    @Scheduled(cron = "0 */30 * * * *")
    public void generateSummary() {
        log.info("Generating AI Summary...");
        final Flux<WeatherStations> allWeatherStations = this.weatherStationsService.getAllWeatherStations();

        allWeatherStations
                .flatMapSequential(weatherStation ->
                        this.weatherDataService.getCurrentWeather(weatherStation.getStationId())
                                .flatMap(current -> {
                                    // A stale reading describes conditions that may be hours gone, so
                                    // summarizing it would narrate them as present. Leaving the previous
                                    // summary in place beats publishing a confidently wrong new one.
                                    if (current.stale()) {
                                        log.info("Skipping AI summary for station {} - newest reading is {}s old",
                                                weatherStation.getStationId(), current.ageSeconds());
                                        return Mono.<WeatherSummary>empty();
                                    }
                                    return this.weatherSummaryService.getSummary(current.reading())
                                            .timeout(Duration.ofSeconds(20))
                                            .collect(Collectors.joining())
                                            .flatMap(summary -> Mono.fromCallable(() -> mapper.readValue(summary, WeatherSummary.class))
                                                    .subscribeOn(Schedulers.boundedElastic()))
                                            .doOnNext(weatherSummary -> {
                                                currentWeatherSummary.put(weatherStation.getStationId(), weatherSummary);
                                                log.info("Weather Summary for {} is : {}", weatherStation.getStationName(), weatherSummary.summary());
                                            })
                                            .retryWhen(Retry.backoff(3, Duration.ofSeconds(1)))
                                            .doOnError(error -> log.error("Failed to generate summary for station {} after retries", weatherStation.getStationId()));
                                })
                                .switchIfEmpty(Mono.fromRunnable(() ->
                                        log.info("No records for station {}", weatherStation.getStationId())))
                                .onErrorResume(error -> Mono.empty()), 4)
                .subscribe();
    }
}
