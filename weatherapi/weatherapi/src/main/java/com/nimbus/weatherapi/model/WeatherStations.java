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
import java.time.Instant;

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

    // Metadata
    private final String timezone;       // e.g. "America/New_York"
    private final Double elevation;      // meters above sea level
    private final String visibility;     // e.g. PUBLIC | PRIVATE | INTERNAL
    private final String city;
    private final String state;
    private final String county;
    private final String country;
    private final String postalCode;
    private final Instant commissionedAt; // install/activation date
    private final Instant retiredAt;      // null if active
    private final String landUse;        // e.g. RESIDENTIAL | AGRICULTURE | INDUSTRIAL

    public WeatherStations(
            final GeoJsonPoint location,
            final String stationName,
            final String stationId,
            final String timezone,
            final Double elevation,
            final String visibility,
            final String city,
            final String state,
            final String county,
            final String country,
            final String postalCode,
            final Instant commissionedAt,
            final Instant retiredAt,
            final String landUse
    ) {
        this.location = location;
        this.stationName = stationName;
        this.stationId = stationId;
        this.timezone = timezone;
        this.elevation = elevation;
        this.visibility = visibility;
        this.city = city;
        this.state = state;
        this.county = county;
        this.country = country;
        this.postalCode = postalCode;
        this.commissionedAt = commissionedAt;
        this.retiredAt = retiredAt;
        this.landUse = landUse;
    }

    public WeatherStations(final WeatherStationRepresentation r) {
        this(
                new GeoJsonPoint(r.longitude(), r.latitude()),
                r.stationName(),
                r.stationId(),
                r.timezone(),
                r.elevation(),
                r.visibility(),
                r.city(),
                r.state(),
                r.county(),
                r.country(),
                r.postalCode(),
                r.commissionedAt(),
                r.retiredAt(),
                r.landUse()
        );
    }

    public static WeatherStations of(final WeatherStationRepresentation r) {
        return new WeatherStations(r);
    }
}