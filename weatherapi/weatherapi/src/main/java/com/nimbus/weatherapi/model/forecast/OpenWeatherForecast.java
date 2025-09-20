package com.nimbus.weatherapi.model.forecast;


import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record OpenWeatherForecast(
        String cod,
        int message,
        int cnt,
        List<ForecastItem> list,
        City city
) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ForecastItem(
            long dt,
            Main main,
            List<Weather> weather,
            Clouds clouds,
            Wind wind,
            Integer visibility,
            Double pop,
            Sys sys,
            Rain rain,
            @JsonProperty("dt_txt") String dtTxt
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Main(
            double temp,
            @JsonProperty("feels_like") double feelsLike,
            @JsonProperty("temp_min") double tempMin,
            @JsonProperty("temp_max") double tempMax,
            int pressure,
            @JsonProperty("sea_level") Integer seaLevel,
            @JsonProperty("grnd_level") Integer grndLevel,
            int humidity,
            @JsonProperty("temp_kf") double tempKf
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Weather(
            int id,
            String main,
            String description,
            String icon
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Clouds(int all) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Wind(
            double speed,
            int deg,
            Double gust
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Sys(String pod) {}

    /** "rain": { "3h": 1.23 } — field name starts with a digit, so we map it. */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Rain(@JsonProperty("3h") Double threeHour) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record City(
            int id,
            String name,
            Coord coord,
            String country,
            int population,
            int timezone,
            long sunrise,
            long sunset
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Coord(double lat, double lon) {}
}
