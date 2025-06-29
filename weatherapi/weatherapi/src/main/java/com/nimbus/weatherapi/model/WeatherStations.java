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
@Document(collection = "weather_stations")
@CompoundIndexes(
        @CompoundIndex(
                name = "station_name_station_id_unique",
                unique = true,
                def = "{'stationName': 1, 'stationId': 1}"
        )
)
@ToString
public final class WeatherStations {
    @Id
    private String id;
    @GeoSpatialIndexed(type = GeoSpatialIndexType.GEO_2DSPHERE)
    private final GeoJsonPoint location;
    private final String stationName;
    private final String stationId;

    public WeatherStations(final GeoJsonPoint location, final String stationName, final String stationId) {

        this.location = location;
        this.stationName = stationName;
        this.stationId = stationId;
    }

}