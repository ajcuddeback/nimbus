package com.nimbus.weatherapi.service;

import lombok.extern.slf4j.Slf4j;
import org.eclipse.paho.mqttv5.client.IMqttDeliveryToken;
import org.eclipse.paho.mqttv5.client.IMqttToken;
import org.eclipse.paho.mqttv5.client.MqttCallback;
import org.eclipse.paho.mqttv5.client.MqttDisconnectResponse;
import org.eclipse.paho.mqttv5.common.MqttException;
import org.eclipse.paho.mqttv5.common.MqttMessage;
import org.eclipse.paho.mqttv5.common.packet.MqttProperties;

@Slf4j
public class WeatherDataCallback implements MqttCallback {
    @Override
    public void messageArrived(String topic, MqttMessage message) {
        log.info("Received message: \n  topic：{}\n  Qos：{}\n  payload：{}", topic, message.getQos(), new String(message.getPayload()));
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
