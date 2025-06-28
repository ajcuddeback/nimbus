package com.nimbus.weatherapi.service;

import com.nimbus.weatherapi.model.Location;
import com.nimbus.weatherapi.model.WeatherData;
import com.nimbus.weatherapi.repository.WeatherDataRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.geo.Point;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.aggregation.*;
import org.springframework.data.mongodb.core.query.NearQuery;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
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

    public Flux<Location> getLocations(
            final String lon,
            final String lat,
            final int maxDistance
    ) {
        double earthRadiusInMeters = 6378100.0;
        double lonValue = Double.parseDouble(lon);
        double latValue = Double.parseDouble(lat);

        // TODO: The way I've done this is slowww and memory intensive
        // TODO: Fix this so that we get weather stations near you for the current date
        // TODO: Each weather station should be sending data hourly... So, I'll be guaranteed to find something near you
        // TODO: Look into selecting distinct names maybe as part of a query instead of using an aggregation
        final NearQuery nearQuery = NearQuery.near(new Point(lonValue, latValue))
                .maxDistance(maxDistance / earthRadiusInMeters)
                .spherical(true);

        final GeoNearOperation geoNearOperation = Aggregation.geoNear(nearQuery, "distance");
        final GroupOperation groupOperation = Aggregation.group("stationName")
                .first("stationName").as("locationName")
                .first(ArrayOperators.ArrayElemAt.arrayOf("location.coordinates").elementAt(0)).as("lon")
                .first(ArrayOperators.ArrayElemAt.arrayOf("location.coordinates").elementAt(1)).as("lat");

        TypedAggregation<WeatherData> locations = Aggregation.newAggregation(
                WeatherData.class,
                geoNearOperation,
                groupOperation
        );

        return this.mongoTemplate.aggregate(locations, Location.class);
    }

    public Mono<Page<WeatherData>> getWeatherDataByLocation(
            final String locationName,
            final Pageable pageable
            ) {
        return mongoTemplate
                .query(WeatherData.class)
                .matching(
                        query(where("stationName").is(locationName))
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