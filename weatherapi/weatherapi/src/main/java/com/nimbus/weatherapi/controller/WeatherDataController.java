package com.nimbus.weatherapi.controller;

import com.nimbus.weatherapi.controller.responses.MissingRequiredParamException;
import com.nimbus.weatherapi.model.WeatherData;
import com.nimbus.weatherapi.repository.WeatherDataRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.geo.Metrics;
import org.springframework.data.geo.Point;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import static org.springframework.data.mongodb.core.query.Criteria.where;
import static org.springframework.data.mongodb.core.query.Query.query;

@RestController
@RequestMapping("/weatherData")
public class WeatherDataController {
    private final WeatherDataRepository weatherDataRepository;

    @Autowired
    private ReactiveMongoTemplate mongoTemplate;

    public WeatherDataController(WeatherDataRepository weatherDataRepository) {
        this.weatherDataRepository = weatherDataRepository;
    }

    @GetMapping
    public Mono<Page<WeatherData>> getWeatherDataByLocation(
            @RequestParam String lon,
            @RequestParam String lat,
            @RequestParam(defaultValue = "1000") int maxDistance,
            Pageable pageable) {

        return mongoTemplate
                .query(WeatherData.class)
                .matching(
                        query(where("location")
                                .nearSphere(new Point(Double.parseDouble(lon), Double.parseDouble(lat)))
                                .maxDistance(maxDistance / 6378100.0)
                        )
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
