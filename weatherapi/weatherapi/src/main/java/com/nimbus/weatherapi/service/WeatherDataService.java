package com.nimbus.weatherapi.service;

import com.nimbus.weatherapi.model.WeatherData;
import com.nimbus.weatherapi.repository.WeatherDataRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;

import static org.springframework.data.mongodb.core.query.Criteria.where;
import static org.springframework.data.mongodb.core.query.Query.query;

@Slf4j
@Service
public final class WeatherDataService {
    private final WeatherDataRepository weatherDataRepository;

    @Autowired
    private ReactiveMongoTemplate mongoTemplate;

    public WeatherDataService(final WeatherDataRepository weatherDataRepository) {
        this.weatherDataRepository = weatherDataRepository;
    }

    public Mono<WeatherData> saveWeatherData(final WeatherData weatherData) {
        return weatherDataRepository.save(weatherData);
    }

    public Mono<Page<WeatherData>> getWeatherDataByLocation(
            final String stationId,
            final Pageable pageable
            ) {
        return mongoTemplate
                .query(WeatherData.class)
                .matching(
                        query(where("stationId").is(stationId))
                                .with(pageable.getSort())
                                .skip((long) pageable.getPageNumber() * pageable.getPageSize())
                                .limit(pageable.getPageSize())
                )
                .all()
                .collectList()
                .zipWith(this.weatherDataRepository.count())
                .map(p -> new PageImpl<>(p.getT1(), pageable, p.getT2()));
    }

    public Flux<WeatherData> getTodaysWeather(
            final String stationId,
            final String timezone
    ) {
        final Instant now = Instant.now();
        final ZonedDateTime nowDateTime = ZonedDateTime.ofInstant(now, ZoneId.of(timezone));

        final ZonedDateTime firstHourOfDay = nowDateTime.withHour(0).withMinute(0).withSecond(0).withNano(0);
        final ZonedDateTime lastHourOfDay = nowDateTime.withHour(23).withMinute(59).withSecond(59).withNano(999_999_999);

        final long firstHourOfDayUtcEpoch = firstHourOfDay.toEpochSecond();
        final long lastHourOfDayUtcEpoch = lastHourOfDay.toEpochSecond();


        return mongoTemplate
                .query(WeatherData.class)
                .matching(
                        query(
                                where("stationId")
                                        .is(stationId)
                                        .and("timestamp")
                                        .gte(firstHourOfDayUtcEpoch)
                                        .lte(lastHourOfDayUtcEpoch)
                        )
                                .with(Sort.by("timestamp").descending())
                ).all();
    }
} 