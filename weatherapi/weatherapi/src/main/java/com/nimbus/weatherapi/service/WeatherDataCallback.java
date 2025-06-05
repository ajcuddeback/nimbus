package com.nimbus.weatherapi.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nimbus.weatherapi.model.WeatherData;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.paho.mqttv5.client.IMqttToken;
import org.eclipse.paho.mqttv5.client.MqttCallback;
import org.eclipse.paho.mqttv5.client.MqttDisconnectResponse;
import org.eclipse.paho.mqttv5.common.MqttException;
import org.eclipse.paho.mqttv5.common.MqttMessage;
import org.eclipse.paho.mqttv5.common.packet.MqttProperties;

@Slf4j
public class WeatherDataCallback implements MqttCallback {
    private final WeatherDataService weatherDataService;

    public WeatherDataCallback(WeatherDataService weatherDataService) {
        super();
        this.weatherDataService = weatherDataService;
    }

    @Override
    public void messageArrived(String topic, MqttMessage message) {
        log.info("Received message: \n  topic：{}\n  Qos：{}\n  payload：{}", topic, message.getQos(), new String(message.getPayload()));

        final ObjectMapper mapper = new ObjectMapper();
        try {
            final JsonNode jsonNode = mapper.readTree(new String(message.getPayload()));
            final WeatherData weatherData = new WeatherData(
                    jsonNode.get("temp").asDouble(),
                    jsonNode.get("temp_format").asText(),
                    jsonNode.get("hum").asDouble(),
                    jsonNode.get("pr").asDouble(),
                    jsonNode.get("pr_format").asText(),
                    jsonNode.get("timestamp").asLong(),
                    new WeatherData.Coordinates(jsonNode.get("coordinates").get("long").asDouble(), jsonNode.get("coordinates").get("lat").asDouble()),
                    jsonNode.get("station_name").asText()
            );

            try {
                // TODO: Look into retries
                this.weatherDataService.saveWeatherData(weatherData);
            } catch (final Exception e) {
                log.error("Failed to save weather data", e);
            }
        } catch (final JsonProcessingException e) {
            log.error("Failed", e);
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
        log.info("Connection complete");
    }

    @Override
    public void authPacketArrived(int reasonCode, MqttProperties properties) {

    }
}
