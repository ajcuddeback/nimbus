package com.nimbus.weatherapi.model;

import lombok.Getter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.GeoSpatialIndexType;
import org.springframework.data.mongodb.core.index.GeoSpatialIndexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Getter
@Document(collection = "weather_data")
@CompoundIndexes(
        @CompoundIndex(
                name = "station_timestamp_unique",
                unique = true,
                def = "{'stationName': 1, 'timestamp': 1}"
        )
)

public final class WeatherData {
    @Id
    private String id;
    private final double temp;
    private final String tempFormat;
    private final double hum;
    private final double pr;
    private final String prFormat;
    private final long timestamp;
    @GeoSpatialIndexed(type = GeoSpatialIndexType.GEO_2DSPHERE)
    private final Location location;
    private final String stationName;

    public record Location(String type, List<Double> coordinates) {}

    public WeatherData(final double temp, final String tempFormat, final double hum,
                      final double pr, final String prFormat, final long timestamp,
                      final Location location, final String stationName) {
        this.temp = temp;
        this.tempFormat = tempFormat;
        this.hum = hum;
        this.pr = pr;
        this.prFormat = prFormat;
        this.timestamp = timestamp;
        this.location = location;
        this.stationName = stationName;
    }

}