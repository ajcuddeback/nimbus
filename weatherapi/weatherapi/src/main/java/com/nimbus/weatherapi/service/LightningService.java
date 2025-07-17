package com.nimbus.weatherapi.service;

import com.nimbus.weatherapi.model.Lightning;
import com.nimbus.weatherapi.repository.LightningRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class LightningService {
    private final LightningRepository lightningRepository;

    public LightningService (final LightningRepository lightningRepository) {
        this.lightningRepository = lightningRepository;
    }

    public void saveLightning(final Lightning lightning) {
        lightningRepository.save(lightning)
                .subscribe(
                        weatherDataResponse -> {
                            log.info("Successfully created weather data entry with id {}", weatherDataResponse.getId());
                        },
                        err -> {
                            if (err instanceof DuplicateKeyException) {
                                log.warn("Failed to save weather data. Unique constraint failed for {}", lightning);
                                return;
                            }
                            log.error("Failed to save weather data", err);
                        }
                );    }
}
