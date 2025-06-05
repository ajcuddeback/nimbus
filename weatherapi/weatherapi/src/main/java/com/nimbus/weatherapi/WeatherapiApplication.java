package com.nimbus.weatherapi;

import com.nimbus.weatherapi.service.MqttService;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ApplicationContext;

@SpringBootApplication
public final class WeatherapiApplication {
	public static void main(final String[] args) {
		SpringApplication.run(WeatherapiApplication.class, args);
	}
}
