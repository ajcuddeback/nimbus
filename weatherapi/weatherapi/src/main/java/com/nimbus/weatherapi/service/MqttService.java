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

        Mono.defer(() ->
                        this.connectAsync(connectionOptions)
                                .doOnSuccess(v -> log.info("Connected to MQTT"))
                                .then(this.subscribeAsync()
                                        .doOnSuccess(x -> log.info("Subscribed to topic {}", topic))
                                )
                ).doOnError(e -> log.error("Error in MQTT setup: {}", e.getMessage()))
                .retryWhen(Retry.backoff(3, Duration.ofSeconds(1)))
                .subscribe();
    }

    private Mono<Void> connectAsync(final MqttConnectionOptions connectionOptions) {
        return Mono.create(sink -> {
            if (this.mqttClient.isConnected()) {
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

    private Mono<Void> subscribeAsync() {
        return Mono.create(sink -> {
            try {
                this.mqttClient.subscribe(topic, qos, null, new MqttActionListener() {
                    @Override
                    public void onSuccess(final IMqttToken token) {
                        log.info("Subscribed to topic {} with qos {}", topic, qos);
                        sink.success();
                    }

                    @Override
                    public void onFailure(final IMqttToken token, final Throwable exception) {
                        log.error("Failed to subscribe to topic {} with qos {}. Error: {}", topic, qos, exception.getMessage());
                        sink.error(exception);
                    }
                });
            } catch (final MqttException e) {
                log.error(e.getMessage());
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