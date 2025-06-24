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
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

import java.nio.charset.StandardCharsets;
import java.time.Duration;

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
        } catch (Exception e) {
            log.error("Failed during MQTT initialization", e);
        }
    }

    public void connect() throws MqttException {
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

        this.connectAsync(this.mqttClient, connectionOptions)
                .retryWhen(Retry.backoff(3, Duration.ofSeconds(1)))
                .doOnError(e -> log.error("Failed to connect to MQTT Server with error {}", e.getMessage()))
                .doOnSuccess(ignored -> log.info("Successfully connected to MQTT Server with client id {}", this.mqttClient.getClientId()))
                .subscribe();
    }

    private Mono<Void> connectAsync(final MqttAsyncClient client, final MqttConnectionOptions connectionOptions) {
        return Mono.create(sink -> {
            if (client.isConnected()) {
                sink.success();
                return;
            }

            try {
                this.mqttClient.connect(connectionOptions, null, new MqttActionListener() {
                    @Override
                    public void onSuccess(final IMqttToken iMqttToken) {
                        sink.success();
                    }

                    @Override
                    public void onFailure(final IMqttToken iMqttToken, final Throwable exception) {
                        log.error("Failed to connect to MQTT client! Error: {}", exception.getMessage());
                        sink.error(exception);
                    }
                });
            } catch (final MqttException e) {
                log.error("Failed to establish MQTT connection! Error: {}", e.getMessage());
                sink.error(e);
            }
        });
    }

    @PreDestroy
    public void disconnect() throws MqttException {
        try {
            if (mqttClient != null && mqttClient.isConnected()) {
                mqttClient.disconnect(null, new MqttActionListener() {
                    @Override
                    public void onSuccess(final IMqttToken iMqttToken) {
                        log.info("Disconnected from MQTT broker cleanly");
                    }

                    @Override
                    public void onFailure(final IMqttToken iMqttToken, final Throwable exception) {
                        log.error("Error during MQTT disconnect", exception);
                    }
                });
            }
        } catch (MqttException e) {
            log.warn("Error during MQTT disconnect", e);
        }
    }
} 