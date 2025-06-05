package com.nimbus.weatherapi.service;

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

    @Value("${mqtt.qos}")
    private Integer qos;

    public MqttService(final WeatherDataService weatherDataService) {
        this.weatherDataService = weatherDataService;
    }

    @PostConstruct
    public void init() {
        try {
            // TODO: Look into refactoring to async mqtt client - as everything else will end up using project reactor/async coding anyway
            this.mqttClient = new MqttClient(brokerUrl, clientId, new MemoryPersistence());
            connect();
            log.info("Successfully connected to MQTT Server with client id {}", this.mqttClient.getClientId());
        } catch (Exception e) {
            log.error("Failed during MQTT initialization", e);
        }
    }

    public void connect() throws MqttException {
        // TODO: Look into these connection options and test connection outages - ensure we can still pick up missed messages
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

        this.mqttClient.setCallback(new WeatherDataCallback(weatherDataService));

        connectionOptions.setAutomaticReconnect(true);
        connectionOptions.setCleanStart(false);

        this.mqttClient.connect(connectionOptions);

        this.mqttClient.subscribe(topic, qos);
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