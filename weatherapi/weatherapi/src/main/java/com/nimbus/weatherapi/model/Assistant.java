package com.nimbus.weatherapi.model;

import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.UserMessage;
import dev.langchain4j.service.V;
import dev.langchain4j.service.spring.AiService;
import reactor.core.publisher.Flux;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;

@AiService
public interface Assistant {
    @UserMessage("You are a weather tip writer. Using the JSON below, output ONLY a JSON object:\n" +
            "{\"summary\":\"<<=25 words>\",\"severity\":\"info|warning|urgent\"} \n" +
            "\n" +
            "Rules:\n" +
            "- One practical sentence, ≤25 words, plain ASCII, no emojis.\n" +
            "- You should use a light tone\n" +
            "- Choose severity based on the data. \n" +
            "- No extra keys or text outside the JSON.\n" +
            "- Do not include any actual weather data in the response.\n" +
            "- Please account for the time of day in your response.\n" +
            "- Do not assume what the weather will be in the future in your response. Only report on what the weather is now \n" +
            "- Do not include the actual time in your response.\n" +
            "Current date and time in ISO Date Format is: {{time}}" +
            "\n" +
            "Here is the current weather data: \n" +
            "Temperature in Celcius: {{temp}}" +
            "\n Humidity Percentage: {{hum}}" +
            "\n Wind Speed in Miles Per Hour: {{wind}} ")
    Flux<String> getWeatherSummary(
            @V("time") String time,
            @V("temp") String temp,
            @V("hum") String hum,
            @V("wind") String wind
    );
}
