package com.nimbus.weatherapi.model;

import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.spring.AiService;
import reactor.core.publisher.Flux;

@AiService
public interface Assistant {
    @SystemMessage("You are a weather tip writer")
    // TODO: Look into changing it from Flux<String> to Flux<WeatherSummary> - want to see if this would even work...
    Flux<String> chat(final String userMessage);
}
