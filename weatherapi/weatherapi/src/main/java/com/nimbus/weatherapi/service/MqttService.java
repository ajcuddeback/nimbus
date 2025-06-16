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
    private MqttAsyncClient mqttClient;
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
            this.mqttClient = new MqttAsyncClient(brokerUrl, clientId, new MemoryPersistence());
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
        final MqttAsyncClient client = this.mqttClient;

        // TODO: Look into using Completable future to help with readability of this callback hell
        this.mqttClient.connect(connectionOptions, null, new MqttActionListener() {
            @Override
            public void onSuccess(final IMqttToken iMqttToken) {
                try {
                    client.subscribe(topic, qos, null, new MqttActionListener() {
                        @Override
                        public void onSuccess(final IMqttToken token) {
                            log.info("Subscribed to topic {} with qos {}", topic, qos);
                        }

                        @Override
                        public void onFailure(final IMqttToken token, final Throwable exception) {
                            log.error("Failed to subscribe to topic {} with qos {}. Error: {}", topic, qos, exception.getMessage());
                        }
                    });
                } catch (final MqttException e) {
                    log.error(e.getMessage());
                }
            }

            @Override
            public void onFailure(IMqttToken iMqttToken, Throwable exception) {
                log.error("Failed to connect to MQTT client! Error: {}", exception.getMessage());
            }
        });
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