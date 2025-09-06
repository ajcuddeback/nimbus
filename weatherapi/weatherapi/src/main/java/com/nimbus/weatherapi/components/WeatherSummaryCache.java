package com.nimbus.weatherapi.components;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nimbus.weatherapi.model.WeatherRecord;
import com.nimbus.weatherapi.model.WeatherStations;
import com.nimbus.weatherapi.model.llm.WeatherSummary;
import com.nimbus.weatherapi.service.WeatherStationsService;
import com.nimbus.weatherapi.service.WeatherSummaryService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Component
public class WeatherSummaryCache {
    private final Map<String, WeatherSummary> currentWeatherSummary = new HashMap<>();
    private final WeatherDataCache weatherDataCache;
    private final WeatherSummaryService weatherSummaryService;
    private final WeatherStationsService weatherStationsService;

    public WeatherSummaryCache(
            WeatherDataCache weatherDataCache,
            WeatherSummaryService weatherSummaryService,
            WeatherStationsService weatherStationsService
    ) {
        this.weatherDataCache = weatherDataCache;
        this.weatherSummaryService = weatherSummaryService;
        this.weatherStationsService = weatherStationsService;
    }
    private final ObjectMapper mapper = new ObjectMapper();


    public final WeatherSummary getAISummary(final String stationId) {
        return this.currentWeatherSummary.getOrDefault(stationId, new WeatherSummary("No summary available yet", "info"));
    }

    // TODO: Maybe add a check to see if there is a drastic difference between current and previous weather data to run this
    @Scheduled(cron = "0 */10 * * * *")
    public void generateSummaryEveryFiveMinutes() {
        log.info("Generating AI Summary...");
        final Flux<WeatherStations> allWeatherStations = this.weatherStationsService.getAllWeatherStations();

        allWeatherStations
                .flatMapSequential(weatherStation -> {
                    final List<WeatherRecord> records = weatherDataCache.getWeatherData(weatherStation.getStationId());
                    if (records == null || records.isEmpty()) {
                        log.info("No records for station {}", weatherStation.getStationId());
                        return Mono.empty();
                    }

                    return this.weatherSummaryService.getSummary(records.getFirst())
                            .timeout(Duration.ofSeconds(20))
                            .onErrorResume(error -> {
                                log.error("Could not retrieve AI Summary!");
                                return Flux.empty();
                            })
                            .collect(Collectors.joining())
                            // TODO: Add retry logic if the mapper is wrong. By default we keep whatever was in the summary previously
                            .flatMap(summary -> Mono.fromCallable(() -> mapper.readValue(summary, WeatherSummary.class))
                                    .subscribeOn(Schedulers.boundedElastic()))
                            .doOnNext(weatherSummary -> {
                                currentWeatherSummary.put(weatherStation.getStationId(), weatherSummary);

                                log.info("Weather Summary for {} is : {}", weatherStation.getStationName(), weatherSummary.summary());
                            })
                            .doOnError(error -> {
                                log.error("Failed to parse summary");
                            });
                }, 4)
                .subscribe();
    }
}
