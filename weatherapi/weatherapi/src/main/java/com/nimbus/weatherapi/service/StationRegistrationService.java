package com.nimbus.weatherapi.service;

import com.nimbus.weatherapi.model.WeatherStations;
import com.nimbus.weatherapi.repository.WeatherStationsDataRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

@Slf4j
@Service
public class StationRegistrationService {
    private final WeatherStationsDataRepository weatherStationsDataRepository;

    StationRegistrationService(
            WeatherStationsDataRepository weatherStationsDataRepository
    ) {
        this.weatherStationsDataRepository = weatherStationsDataRepository;
    }

    public String generateStationId(
            final String city,
            final String state,
            final double lon,
            final double lat
    ) throws NoSuchAlgorithmException {
        final String combinedData = city + state + lon + lat;
        final MessageDigest md = MessageDigest.getInstance("MD5");
        md.update(combinedData.getBytes());
        final byte[] digest = md.digest();
        final StringBuilder sb = new StringBuilder();
        for (byte b : digest) {
            sb.append(String.format("%02x", b)); // Convert byte to hexadecimal
        }
        return sb.toString();
    }

    public Mono<Boolean> weatherStationExists(final String stationId) {
        return weatherStationsDataRepository.findByStationId(stationId)
                .collectList()
                .flatMap(weatherStations -> {
                    if (weatherStations.isEmpty()) {
                        return Mono.just(false);
                    }

                    return Mono.just(true);
                })
                .doOnSuccess(hasStation -> {
                    if (hasStation) {
                        log.info("Found station already, publishing event via MQTT");
                    }
                });
    }

    public Mono<String> registerWeatherStation(
            final String city,
            final String state,
            final double lon,
            final double lat
    ) throws NoSuchAlgorithmException {
        String stationId;
        try {
            stationId = generateStationId(city, state, lon, lat);
        } catch (NoSuchAlgorithmException e) {
            log.error("Failed to generate station id: ", e);
            return Mono.error(e);
        }

        return this.weatherStationExists(stationId).flatMap(stationExists -> {
            if (!stationExists) {
                return Mono.just(stationId);
            }
            final WeatherStations weatherStations = new WeatherStations(
                    new GeoJsonPoint(lon, lat),
                    city + ", " + state,
                    stationId
            );

            return weatherStationsDataRepository.save(weatherStations)
                    .doOnSuccess(weatherStationResponse -> {
                        log.info("Successfully created weather station, publishing event via MQTT");
                    })
                    .doOnError(error -> {
                        log.error("Failed to save weather station! Error: {}", error.getMessage());
                    })
                    .flatMap(ignored -> Mono.just(stationId));
        });
    }
}
