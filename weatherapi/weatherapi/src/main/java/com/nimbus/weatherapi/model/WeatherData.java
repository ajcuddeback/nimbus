package com.nimbus.weatherapi.model;

import lombok.Getter;
import lombok.ToString;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.GeoSpatialIndexType;
import org.springframework.data.mongodb.core.index.GeoSpatialIndexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Getter
@Document(collection = "weather_data")
@CompoundIndexes(
        @CompoundIndex(
                name = "station_timestamp_unique",
                unique = true,
                def = "{'stationId': 1, 'timestamp': 1}"
        )
)
@ToString
public final class WeatherData {
    @Id
    private String id;
    private final double temp;
    private final String tempFormat;
    private final double hum;
    private final double pr;
    private final String prFormat;
    private final long timestamp;
    private final String stationId;

    public WeatherData(final double temp, final String tempFormat, final double hum,
                      final double pr, final String prFormat, final long timestamp, final String stationId) {
        this.temp = temp;
        this.tempFormat = tempFormat;
        this.hum = hum;
        this.pr = pr;
        this.prFormat = prFormat;
        this.timestamp = timestamp;
        this.stationId = stationId;
    }

}