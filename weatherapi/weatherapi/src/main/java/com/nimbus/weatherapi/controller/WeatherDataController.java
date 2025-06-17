package com.nimbus.weatherapi.controller;

import com.nimbus.weatherapi.model.WeatherData;
import com.nimbus.weatherapi.repository.WeatherDataRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.data.geo.Point;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

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
    public Flux<WeatherData> getWeatherData() {
        return weatherDataRepository.findAll();
    }

    // TODO: Unsure if the way I did this is best practice. Paging with webflux isn't fully supported
    // This may work, but we aren't getting the total results out in the response. Do some research on best practice here
    @GetMapping("/{lon}/{lat}")
    public Flux<WeatherData> getWeatherDataByLocation(
            @PathVariable String lon,
            @PathVariable String lat,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "timestamp") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection) {

        final Sort sort = Sort.by(sortDirection, sortBy);

        return mongoTemplate
                .query(WeatherData.class)
                .matching(
                        query(where("location")
                            .nearSphere(new Point(Double.parseDouble(lon), Double.parseDouble(lat)))
                        )
                            .with(sort)
                            .skip((long) page * size)
                            .limit(size)
                )
                .all();
    }
}
