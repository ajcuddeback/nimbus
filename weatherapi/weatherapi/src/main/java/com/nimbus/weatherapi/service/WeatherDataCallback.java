package com.nimbus.weatherapi.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nimbus.weatherapi.model.Lightning;
import com.nimbus.weatherapi.model.WeatherSeriesData;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.paho.mqttv5.client.IMqttToken;
import org.eclipse.paho.mqttv5.client.MqttCallback;
import org.eclipse.paho.mqttv5.client.MqttDisconnectResponse;
import org.eclipse.paho.mqttv5.common.MqttException;
import org.eclipse.paho.mqttv5.common.MqttMessage;
import org.eclipse.paho.mqttv5.common.packet.MqttProperties;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;

@Slf4j
public class WeatherDataCallback implements MqttCallback {
    private final StationRegistrationService stationRegistrationService;
    private final MqttService mqttService;
    private final LightningService lightningService;
    private final WeatherDataService weatherDataService;

    public WeatherDataCallback(
            StationRegistrationService stationRegistrationService,
            MqttService mqttService,
            LightningService lightningService,
            WeatherDataService weatherDataService
    ) {
        super();
        this.stationRegistrationService = stationRegistrationService;
        this.mqttService = mqttService;
        this.lightningService = lightningService;
        this.weatherDataService = weatherDataService;
    }

    @Override
    public void messageArrived(String topic, MqttMessage message) {
        if (topic.equalsIgnoreCase("weather/data")) {
            log.info("Received message: \n  topic：{}\n  Qos：{}\n  payload：{}", topic, message.getQos(), new String(message.getPayload()));

            final ObjectMapper mapper = new ObjectMapper();
            try {
                final JsonNode jsonNode = mapper.readTree(new String(message.getPayload()));
                final WeatherSeriesData weatherSeriesData = new WeatherSeriesData(
                        jsonNode.get("temp").asDouble(),
                        jsonNode.get("temp_format").asText(),
                        jsonNode.get("hum").asDouble(),
                        jsonNode.get("pr").asDouble(),
                        jsonNode.get("pr_format").asText(),
                        jsonNode.get("wind_direction").asDouble(),
                        jsonNode.get("wind_speed").asDouble(),
                        jsonNode.get("wind_speed_format").asText(),
                        jsonNode.get("rainfall").asDouble(),
                        jsonNode.get("rainfall_format").asText(),
                        Instant.ofEpochSecond(jsonNode.get("timestamp").asLong()),
                        jsonNode.get("stationId").asText()
                );

                this.weatherDataService.saveSeriesRecord(weatherSeriesData)
                        .subscribe(
                                // At info, matching the "Received message" log above: the pair is what
                                // makes a missing write visible at the default log level.
                                saved -> log.info("Saved minute reading for station {} at {}",
                                        saved.getStationId(), saved.getTimestamp()),
                                err -> log.error("Failed to save weather data to time series!", err)
                        );
            } catch (final JsonProcessingException e) {
                log.error("Failed", e);
            }
        } else if (topic.equalsIgnoreCase("stationId/request")) {
            final ObjectMapper mapper = new ObjectMapper();
            try {
                final JsonNode jsonNode = mapper.readTree(new String(message.getPayload()));

                this.stationRegistrationService.registerWeatherStation(
                        jsonNode.get("city").asText(),
                        jsonNode.get("state").asText(),
                        jsonNode.get("lon").asDouble(),
                        jsonNode.get("lat").asDouble()
                ).flatMap(data ->{
                    try {
                        this.mqttService.publishEvent("stationId", data.getBytes(StandardCharsets.UTF_8));
                    } catch (MqttException e) {
                        throw new RuntimeException(e);
                    }
                    return Mono.empty();
                }).subscribe();
            } catch (final JsonProcessingException e) {
                log.error("Failed", e);
            } catch (final NoSuchAlgorithmException e) {
                log.error("Failed", e);
                throw new RuntimeException(e);
            }
        } else if (topic.equalsIgnoreCase("weather/lightning")) {
            log.info("Lightning was detected!: \n  topic：{}\n  Qos：{}\n  payload：{}", topic, message.getQos(), new String(message.getPayload()));

            final ObjectMapper mapper = new ObjectMapper();
            try {
                final JsonNode jsonNode = mapper.readTree(new String(message.getPayload()));
                final Lightning lightning = new Lightning(
                        jsonNode.get("distance").asInt(),
                        jsonNode.get("distanceFormat").asText(),
                        jsonNode.get("intensity").asInt(),
                        jsonNode.get("stationId").asText(),
                        jsonNode.get("timestamp").asLong()
                );

                try {
                    this.lightningService.saveLightning(lightning);
                } catch (final Exception e) {
                    log.error("Failed to save weather data", e);
                }
            } catch (final JsonProcessingException e) {
                log.error("Failed", e);
            }
        }
    }

    @Override
    public void disconnected(MqttDisconnectResponse disconnectResponse) {
        log.info("Disconnected");
    }

    @Override
    public void mqttErrorOccurred(MqttException exception) {
        log.error("Error: {}", String.valueOf(exception));
    }

    @Override
    public void deliveryComplete(IMqttToken token) {
        log.info("Delivery completed");
    }

    @Override
    public void connectComplete(boolean reconnect, String serverURI) {
        log.info("Connection complete. Reconnect: {}", reconnect);
        if (reconnect) {
            log.info("Reconnected to MQTT broker, re-subscribing to topics...");
            try {
                mqttService.resubscribe();
            } catch (MqttException e) {
                log.error("Failed to re-subscribe after reconnect", e);
            }
        }
    }

    @Override
    public void authPacketArrived(int reasonCode, MqttProperties properties) {

    }
}
