package com.nimbus.weatherapi.repository;

import com.nimbus.weatherapi.model.Lightning;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;

public interface LightningRepository extends ReactiveMongoRepository<Lightning, String> {
}
