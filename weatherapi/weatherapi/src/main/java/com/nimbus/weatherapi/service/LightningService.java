package com.nimbus.weatherapi.service;

import com.nimbus.weatherapi.model.Lightning;
import com.nimbus.weatherapi.repository.LightningRepository;
import lombok.extern.slf4j.Slf4j;
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
                        lightningResponse -> {
                            log.info("Successfully created lighting data entry with id {}", lightningResponse.getId());
                        },
                        err -> {
                            log.error("Failed to save lightning data", err);
                        }
                );
    }
}
