package com.nimbus.weatherapi;

import com.nimbus.weatherapi.service.MqttService;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ApplicationContext;

@SpringBootApplication
public final class WeatherapiApplication {

	public static void main(final String[] args) {
		final ApplicationContext context = SpringApplication.run(WeatherapiApplication.class, args);
		
		// Initialize MQTT connection
		final MqttService mqttService = context.getBean(MqttService.class);
		try {
			mqttService.connect();
		} catch (final Exception e) {
			e.printStackTrace();
		}
	}

}
