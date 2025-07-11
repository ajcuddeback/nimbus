package com.nimbus.weatherapi.service;

import com.nimbus.weatherapi.model.WeatherData;
import com.nimbus.weatherapi.model.WeatherStations;
import com.nimbus.weatherapi.repository.WeatherStationsDataRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.geo.Point;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import static org.springframework.data.mongodb.core.query.Criteria.where;
import static org.springframework.data.mongodb.core.query.Query.query;

@Service
public class WeatherStationsService {
    private final WeatherStationsDataRepository weatherStationsDataRepository;
    @Autowired
    private ReactiveMongoTemplate mongoTemplate;

    public WeatherStationsService(WeatherStationsDataRepository weatherStationsDataRepository) {
        this.weatherStationsDataRepository = weatherStationsDataRepository;
    }

    public Mono<Page<WeatherStations>> getWeatherStationsByLocation(
            final Double lon,
            final Double lat,
            final Double maxDistance,
            final Pageable pageable
    ) {
        final double earthRadiusInMeters = 6378100.0;
        return mongoTemplate
                .query(WeatherStations.class)
                .matching(
                        query(where("location").nearSphere(new Point(lon, lat)).maxDistance(maxDistance / earthRadiusInMeters))
                                .with(pageable.getSort())
                                .skip((long) pageable.getPageNumber() * pageable.getPageSize())
                                .limit(pageable.getPageSize())
                )
                .all()
                .collectList()
                .zipWith(this.weatherStationsDataRepository.count())
                .map(p -> new PageImpl<>(p.getT1(), pageable, p.getT2()));
    }
}
