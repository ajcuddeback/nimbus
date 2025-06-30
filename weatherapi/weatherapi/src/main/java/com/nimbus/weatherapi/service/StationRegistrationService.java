package com.nimbus.weatherapi.service;

import com.nimbus.weatherapi.model.WeatherStations;
import com.nimbus.weatherapi.repository.WeatherStationsDataRepository;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.paho.mqttv5.common.MqttException;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

@Slf4j
@Service
public class StationRegistrationService {
    private final MqttService mqttService;
    private final WeatherStationsDataRepository weatherStationsDataRepository;

    StationRegistrationService(
            MqttService mqttService,
            WeatherStationsDataRepository weatherStationsDataRepository
    ) {
        this.mqttService = mqttService;
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

    public Mono<Boolean> weatherStationExists(
            final String city,
            final String state,
            final double lon,
            final double lat
    ) throws NoSuchAlgorithmException {
        final String stationId = generateStationId(city, state, lon, lat);

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
                        try {
                            mqttService.publishEvent("stationId", stationId.getBytes(StandardCharsets.UTF_8));
                        } catch (MqttException e) {
                            log.error("Failed to publish station id to station", e);
                        }
                    }
                });
    }

    public Mono<WeatherStations> registerWeatherStation(
            final String city,
            final String state,
            final double lon,
            final double lat
    ){
        String stationId;
        try {
            stationId = generateStationId(city, state, lon, lat);
        } catch (NoSuchAlgorithmException e) {
            log.error("Failed to generate station id: ", e);
            return Mono.error(e);
        }

        final WeatherStations weatherStations = new WeatherStations(
                new GeoJsonPoint(lon, lat),
                city + ", " + state,
                stationId
        );

        return weatherStationsDataRepository.save(weatherStations)
                .doOnSuccess(weatherStationResponse -> {
                    try {
                        log.info("Successfully created weather station, publishing event via MQTT");
                        mqttService.publishEvent("stationId", stationId.getBytes(StandardCharsets.UTF_8));
                    } catch (final MqttException e) {
                        log.error("Failed to publish station id to station", e);
                    }
                })
                .doOnError(error -> {
                    log.error("Failed to save weather station! Error: {}", error.getMessage());
                });
    }
}
