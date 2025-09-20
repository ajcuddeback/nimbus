package com.nimbus.weatherapi.service;

import com.nimbus.weatherapi.cache.WeatherDataCache;
import com.nimbus.weatherapi.utils.MqttSSLUtility;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.paho.mqttv5.client.*;
import org.eclipse.paho.mqttv5.client.persist.MemoryPersistence;
import org.eclipse.paho.mqttv5.common.MqttException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;

@Slf4j
@Service
public final class MqttService {
    private MqttAsyncClient mqttClient;
    private final StationRegistrationService stationRegistrationService;
    private final LightningService lightningService;
    private final WeatherDataCache weatherDataCache;

    // TODO: Would be nice to move this to a @ConfigurationProperties class - would make this much cleaner!
    @Value("${mqtt.broker.url}")
    private String brokerUrl;

    @Value("${mqtt.client.id}")
    private String clientId;

    @Value("${mqtt.topics}")
    private ArrayList<String> topics;

    @Value("${mqtt.ssl.location}")
    private String sslLocation;

    @Value("${mqtt.user}")
    private String user;

    @Value("${mqtt.password}")
    private String password;

    @Value("${mqtt.qos}")
    private Integer qos;

    public MqttService(
            final StationRegistrationService stationRegistrationService,
            final LightningService lightningService,
            final WeatherDataCache weatherDataCache
            ) {
        this.stationRegistrationService = stationRegistrationService;
        this.lightningService = lightningService;
        this.weatherDataCache = weatherDataCache;
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

        this.mqttClient.setCallback(new WeatherDataCallback(stationRegistrationService, this, lightningService, weatherDataCache));

        connectionOptions.setAutomaticReconnect(true);
        connectionOptions.setCleanStart(false);

        Flux.defer(() -> {
                    log.info("Starting MQTT connection and subscription flow");

                    return this.connectAsync(connectionOptions)
                            .doOnSuccess(v -> log.info("Connected to MQTT"))
                            .thenMany(
                                    Flux.fromIterable(topics)
                                            .doOnNext(t -> log.info("Attempting to subscribe to topic: {}", t))
                                            .flatMap(topic ->
                                                    this.subscribeAsync(topic)
                                                            .doOnSuccess(vv -> log.info("Subscribed to topic: {}", topic))
                                                            .doOnError(e -> log.error("Failed to subscribe to {}: {}", topic, e.getMessage(), e))
                                                            .onErrorResume(e -> Mono.empty()) // continue despite errors
                                            )
                            );
                })
                .doOnError(e -> log.error("Error in MQTT setup: {}", e.getMessage(), e))
                .doFinally(signal -> log.info("MQTT flow finished with signal: {}", signal))
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

    private Mono<Void> subscribeAsync(final String topicToSub) {
        return Mono.create(sink -> {
            try {
                this.mqttClient.subscribe(topicToSub, qos, null, new MqttActionListener() {
                    @Override
                    public void onSuccess(final IMqttToken token) {
                        log.info("Subscribed to topic {} with qos {}", topicToSub, qos);
                        sink.success();
                    }

                    @Override
                    public void onFailure(final IMqttToken token, final Throwable exception) {
                        log.error("Failed to subscribe to topic {} with qos {}. Error: {}", topicToSub, qos, exception.getMessage());
                        sink.error(exception);
                    }
                });
            } catch (final MqttException e) {
                log.error(e.getMessage());
                sink.error(e);
            }
        });
    }

    public void publishEvent(final String topic, final byte[] message) throws MqttException {
        log.info("Publishing Event to {}", topic);
        this.mqttClient.publish(topic, message, qos, true);
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