package com.nimbus.weatherapi.service;

import com.nimbus.weatherapi.model.WeatherData;
import com.nimbus.weatherapi.repository.WeatherDataRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

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
} 