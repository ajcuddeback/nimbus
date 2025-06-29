package com.nimbus.weatherapi.repository;

import com.nimbus.weatherapi.model.WeatherStations;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

@Repository
public interface WeatherStationsDataRepository extends ReactiveMongoRepository<WeatherStations, String> {
    Flux<WeatherStations> findByStationId(final String stationId);
}
