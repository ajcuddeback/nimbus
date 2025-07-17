package com.nimbus.weatherapi.model;


import lombok.Getter;
import lombok.ToString;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

@Getter
@Document("lightning")
@CompoundIndexes({
        @CompoundIndex(
                name = "station_timestamp_desc_idx",
                def = "{'stationId': 1, 'timestamp': -1}"
        )
})
@ToString
public class Lightning {
    @Id
    private String id;
    private final int distance;
    private final String distanceFormat;
    private final int intensity;
    private final String stationId;
    private final long timestamp;

    public Lightning(
        final int distance,
        final String distanceFormat,
        final int intensity,
        final String stationId,
        final long timetamp
    ) {
        this.distance = distance;
        this.distanceFormat = distanceFormat;
        this.intensity = intensity;
        this.stationId = stationId;
        this.timestamp = timetamp;
    }
}
