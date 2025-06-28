package com.nimbus.weatherapi.repository;

import com.nimbus.weatherapi.model.Location;
import com.nimbus.weatherapi.model.WeatherData;
import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

@Repository
public interface WeatherDataRepository extends ReactiveMongoRepository<WeatherData, String> {
}