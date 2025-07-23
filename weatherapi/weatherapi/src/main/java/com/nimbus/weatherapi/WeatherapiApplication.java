package com.nimbus.weatherapi;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public final class WeatherapiApplication {
	public static void main(final String[] args) {
		SpringApplication.run(WeatherapiApplication.class, args);
	}
}
