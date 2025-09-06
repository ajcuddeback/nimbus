package com.nimbus.weatherapi.service;

import com.nimbus.weatherapi.model.Assistant;
import com.nimbus.weatherapi.model.WeatherRecord;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

@Service
@Slf4j
public class WeatherSummaryService {
    @Autowired
    private Assistant assistant;

    // TODO: Use @v params to insert weather data.
    public Flux<String> getSummary(final WeatherRecord weatherData) {
        final String prompt = "You are a weather tip writer. Using the JSON below, output ONLY a JSON object:\n" +
                "{\"summary\":\"<<=25 words>\",\"severity\":\"info|warning|urgent\"} \n" +
                "\n" +
                "Rules:\n" +
                "- One practical sentence, ≤25 words, plain ASCII, no emojis.\n" +
                "- You should use a light tone\n" +
                "- Choose severity based on the data. \n" +
                "- No extra keys or text outside the JSON.\n" +
                "- Do not include any actual weather data in the response.\n" +
                "\n" +
                "Here is the current weather data: \n" +
                "Temperature in Celcius: " +
                weatherData.temp() +
                "\n Humidity Percentage: " +
                weatherData.hum() +
                "\n Wind Speed in Miles Per Hour: " +
                weatherData.windSpeed();

        return assistant.chat(prompt);

    }
}
