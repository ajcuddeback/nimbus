package com.nimbus.weatherapi.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nimbus.weatherapi.utils.MqttSSLUtility;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.paho.mqttv5.client.*;
import org.eclipse.paho.mqttv5.client.persist.MemoryPersistence;
import org.eclipse.paho.mqttv5.common.MqttException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

@Slf4j
@Service
public final class MqttService {
    private MqttClient mqttClient;
    private final ObjectMapper objectMapper;
    private final WeatherDataService weatherDataService;

    @Value("${mqtt.broker.url}")
    private String brokerUrl;

    @Value("${mqtt.client.id}")
    private String clientId;

    @Value("${mqtt.topic}")
    private String topic;

    @Value("${mqtt.ssl.location}")
    private String sslLocation;

    @Value("${mqtt.user}")
    private String user;

    @Value("${mqtt.password}")
    private String password;

    public MqttService(final WeatherDataService weatherDataService) throws MqttException {
        this.weatherDataService = weatherDataService;
        this.objectMapper = new ObjectMapper();
    }

    @PostConstruct
    public void init() {
        log.info("Initializing!");
        try {
            this.mqttClient = new MqttClient(brokerUrl, clientId, new MemoryPersistence());
//            connect();
        } catch (Exception e) {
            log.error("Failed during MQTT initialization", e);
        }
    }

    public void connect() throws MqttException {
        log.info("Starting to connect...");

        MqttConnectionOptions connectionOptions = new MqttConnectionOptions();
        connectionOptions.setUserName(user);
        connectionOptions.setPassword(password.getBytes(StandardCharsets.UTF_8));
        try {
            String caCrtFile = sslLocation;
            connectionOptions.setSocketFactory(MqttSSLUtility.getSingleSocketFactory(caCrtFile));
        } catch (Exception e) {
            log.error("Error fetching and creating SSL: {}", String.valueOf(e));
            throw new RuntimeException(e);
        }

        this.mqttClient.setCallback(new WeatherDataCallback());

        connectionOptions.setAutomaticReconnect(true);
        connectionOptions.setCleanStart(false);

        this.mqttClient.connect(connectionOptions);



        log.info("Connected!");

        this.mqttClient.subscribe(topic, 1);
    }

    @PreDestroy
    public void disconnect() throws MqttException {
        try {
            if (mqttClient != null && mqttClient.isConnected()) {
                mqttClient.disconnect();
                log.info("Disconnected from MQTT broker cleanly");
            }
        } catch (MqttException e) {
            log.warn("Error during MQTT disconnect", e);
        }
    }
} 