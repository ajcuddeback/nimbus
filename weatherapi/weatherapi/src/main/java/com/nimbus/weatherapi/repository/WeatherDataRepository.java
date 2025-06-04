package com.nimbus.weatherapi.repository;

import com.nimbus.weatherapi.model.WeatherData;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WeatherDataRepository extends ReactiveMongoRepository<WeatherData, String> {
} 