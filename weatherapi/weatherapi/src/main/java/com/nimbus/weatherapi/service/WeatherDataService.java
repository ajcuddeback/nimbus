package com.nimbus.weatherapi.service;

import com.nimbus.weatherapi.model.CurrentWeather;
import com.nimbus.weatherapi.model.WeatherData;
import com.nimbus.weatherapi.model.WeatherRecord;
import com.nimbus.weatherapi.model.WeatherSeriesData;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationOperation;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.springframework.data.mongodb.core.query.Criteria.where;
import static org.springframework.data.mongodb.core.query.Query.query;

@Slf4j
@Service
public final class WeatherDataService {

    private static final String SERIES_COLLECTION = "weather_data_series";

    @Autowired
    private ReactiveMongoTemplate mongoTemplate;

    /**
     * How old the newest reading may be before {@code /current} is flagged stale. The station
     * publishes roughly once a minute, so the default rides out a few missed publishes or a brief
     * MQTT reconnect without flapping, while still catching a real outage quickly.
     */
    @Value("${weather.current.stale-after:PT5M}")
    private Duration staleAfter;

    /**
     * Persists a raw minute reading to the time-series collection.
     * <p>
     * Time-series collections cannot enforce a unique index, so we guard duplicates best-effort:
     * if a reading already exists for the same station and exact timestamp we skip the insert.
     * This is not atomic (two identical readings arriving within the same instant could both slip
     * through), which is why read-time de-duplication is the actual correctness guarantee. This
     * check simply keeps the collection from bloating on the common case: MQTT QoS-1 redelivery,
     * where the duplicate arrives seconds/minutes after the original has already been committed.
     */
    public Mono<WeatherSeriesData> saveSeriesRecord(final WeatherSeriesData record) {
        return mongoTemplate.exists(
                        query(where("stationId").is(record.getStationId()).and("timestamp").is(record.getTimestamp())),
                        WeatherSeriesData.class
                )
                .flatMap(exists -> {
                    if (Boolean.TRUE.equals(exists)) {
                        log.warn("Duplicate weather reading for station {} at {} - skipping insert",
                                record.getStationId(), record.getTimestamp());
                        return Mono.empty();
                    }
                    return mongoTemplate.insert(record);
                });
    }

    /**
     * Returns the single most recent minute reading for a station, tagged with its age.
     * <p>
     * Duplicates are irrelevant here (identical copies carry identical values), so we simply take the
     * newest — {@code first()} rather than {@code one()}, since the latter re-limits the query to two
     * documents and throws {@code IncorrectResultSizeDataAccessException} when a duplicate exists.
     * <p>
     * "Most recent" is not the same as "current": if the station stops publishing, this query keeps
     * returning the last reading it ever sent. Rather than let that pass for live data, we report the
     * reading's age and whether it has fallen outside {@link #staleAfter}, leaving the caller to
     * decide how to present it. Empty (no reading at all) is distinct from stale and stays empty.
     */
    public Mono<CurrentWeather> getCurrentWeather(final String stationId) {
        return mongoTemplate
                .query(WeatherSeriesData.class)
                .matching(query(where("stationId").is(stationId)).with(Sort.by("timestamp").descending()).limit(1))
                .first()
                .map(WeatherDataService::toRecord)
                .map(record -> {
                    // Clamped at zero: a station whose clock runs slightly ahead of ours would
                    // otherwise report a negative age.
                    final long ageSeconds = Math.max(0, Instant.now().getEpochSecond() - record.timestamp());
                    return new CurrentWeather(record, ageSeconds > staleAfter.toSeconds(), ageSeconds);
                });
    }

    /**
     * Returns the raw minute readings for the current hour (in the caller's timezone), oldest first,
     * de-duplicated by exact timestamp.
     */
    public Flux<WeatherRecord> getCurrentHourWeather(final String stationId, final String timezone) {
        final ZonedDateTime now = ZonedDateTime.now(ZoneId.of(timezone));
        final Instant startOfHour = now.withMinute(0).withSecond(0).withNano(0).toInstant();

        return mongoTemplate
                .query(WeatherSeriesData.class)
                .matching(
                        query(where("stationId").is(stationId)
                                .and("timestamp").gte(startOfHour).lte(now.toInstant()))
                                .with(Sort.by("timestamp").ascending())
                )
                .all()
                .map(WeatherDataService::toRecord)
                .transform(WeatherDataService::dedupeByTimestamp);
    }

    /**
     * Hourly-aggregated weather for the current day (in the caller's timezone), computed on read
     * from the raw minute series, oldest hour first.
     */
    public Flux<WeatherData> getTodaysWeather(final String stationId, final String timezone) {
        final ZoneId zone = ZoneId.of(timezone);
        final ZonedDateTime now = ZonedDateTime.now(zone);
        final Instant startOfDay = now.withHour(0).withMinute(0).withSecond(0).withNano(0).toInstant();
        final Instant endOfDay = now.withHour(23).withMinute(59).withSecond(59).withNano(999_999_999).toInstant();

        final Aggregation aggregation = Aggregation.newAggregation(
                hourlyAggregationStages(stationId, startOfDay, endOfDay, timezone, true)
        );

        return mongoTemplate.aggregate(aggregation, SERIES_COLLECTION, Document.class)
                .map(WeatherDataService::toWeatherData);
    }

    /**
     * Paginated historical hourly aggregates for a station (newest hour first), computed on read
     * from the raw minute series.
     */
    public Mono<Page<WeatherData>> getWeatherDataByLocation(final String stationId, final Pageable pageable) {
        final List<AggregationOperation> stages = hourlyAggregationStages(stationId, null, null, "UTC", false);
        stages.add(Aggregation.skip((long) pageable.getPageNumber() * pageable.getPageSize()));
        stages.add(Aggregation.limit(pageable.getPageSize()));

        final Mono<List<WeatherData>> content = mongoTemplate
                .aggregate(Aggregation.newAggregation(stages), SERIES_COLLECTION, Document.class)
                .map(WeatherDataService::toWeatherData)
                .collectList();

        // Total = number of distinct hour buckets for the station.
        final List<AggregationOperation> countStages = hourlyAggregationStages(stationId, null, null, "UTC", false);
        countStages.add(context -> new Document("$count", "total"));

        final Mono<Long> total = mongoTemplate
                .aggregate(Aggregation.newAggregation(countStages), SERIES_COLLECTION, Document.class)
                .next()
                .map(d -> ((Number) d.get("total")).longValue())
                .defaultIfEmpty(0L);

        return content.zipWith(total).map(t -> new PageImpl<>(t.getT1(), pageable, t.getT2()));
    }

    /**
     * Builds the shared read-time hourly-aggregation pipeline:
     *   1. match the station (and optional time range)
     *   2. de-duplicate to one record per exact timestamp (read-time guarantee against duplicates)
     *   3. bucket into local-time hours, averaging most fields, summing rainfall, and taking the
     *      circular mean of wind direction
     *   4. project into the {@link WeatherData} shape with an epoch-second hour timestamp
     *   5. sort by hour (ascending for intra-day views, descending for paginated history)
     */
    private static List<AggregationOperation> hourlyAggregationStages(
            final String stationId,
            final Instant start,
            final Instant end,
            final String timezone,
            final boolean ascending
    ) {
        final Document match = new Document("stationId", stationId);
        if (start != null && end != null) {
            match.append("timestamp", new Document("$gte", start).append("$lte", end));
        }

        final Document dedupe = new Document("$group", new Document("_id", "$timestamp")
                .append("temp", first("temp"))
                .append("tempFormat", first("tempFormat"))
                .append("hum", first("hum"))
                .append("pr", first("pr"))
                .append("prFormat", first("prFormat"))
                .append("windDirection", first("windDirection"))
                .append("windSpeed", first("windSpeed"))
                .append("windSpeedFormat", first("windSpeedFormat"))
                .append("rainfall", first("rainfall"))
                .append("rainfallFormat", first("rainfallFormat"))
                .append("timestamp", first("timestamp"))
                // Carried through the dedupe explicitly: a $group drops every field it does not
                // accumulate, so without this the hour-bucket stage below reads $stationId off a
                // document that no longer has it and every aggregate serializes stationId as null.
                .append("stationId", first("stationId")));

        final Document windRadians = new Document("$degreesToRadians", "$windDirection");
        final Document hourGroup = new Document("$group", new Document("_id",
                new Document("$dateTrunc", new Document("date", "$timestamp")
                        .append("unit", "hour")
                        .append("timezone", timezone)))
                .append("temp", new Document("$avg", "$temp"))
                .append("hum", new Document("$avg", "$hum"))
                .append("pr", new Document("$avg", "$pr"))
                .append("windSpeed", new Document("$avg", "$windSpeed"))
                .append("rainfall", new Document("$sum", "$rainfall"))
                .append("sinAvg", new Document("$avg", new Document("$sin", windRadians)))
                .append("cosAvg", new Document("$avg", new Document("$cos", windRadians)))
                .append("tempFormat", first("tempFormat"))
                .append("prFormat", first("prFormat"))
                .append("windSpeedFormat", first("windSpeedFormat"))
                .append("stationId", first("stationId")));

        // Circular mean -> degrees, normalized into [0, 360) so an exact 360 maps back to 0.
        final Document windDegrees = new Document("$radiansToDegrees",
                new Document("$atan2", List.of("$sinAvg", "$cosAvg")));
        final Document windNormalized = new Document("$mod",
                List.of(new Document("$add", List.of(windDegrees, 360)), 360));

        final Document project = new Document("$project", new Document("_id", 0)
                .append("stationId", 1)
                .append("temp", round("$temp"))
                .append("tempFormat", 1)
                .append("hum", round("$hum"))
                .append("pr", round("$pr"))
                .append("prFormat", 1)
                .append("windSpeed", round("$windSpeed"))
                .append("windSpeedFormat", 1)
                .append("rainfall", round("$rainfall"))
                .append("rainfallFormat", 1)
                .append("windDirection", round(windNormalized))
                .append("timestamp", new Document("$toLong",
                        new Document("$divide", List.of(new Document("$toLong", "$_id"), 1000)))));

        final Document sort = new Document("$sort", new Document("timestamp", ascending ? 1 : -1));

        final List<AggregationOperation> stages = new ArrayList<>();
        stages.add(context -> new Document("$match", match));
        stages.add(context -> dedupe);
        stages.add(context -> hourGroup);
        stages.add(context -> project);
        stages.add(context -> sort);
        return stages;
    }

    private static Document first(final String field) {
        return new Document("$first", "$" + field);
    }

    private static Document round(final Object expression) {
        return new Document("$round", List.of(expression, 2));
    }

    private static Flux<WeatherRecord> dedupeByTimestamp(final Flux<WeatherRecord> records) {
        return records.collectList().flatMapMany(list -> {
            final Map<Long, WeatherRecord> byTimestamp = new LinkedHashMap<>();
            list.forEach(r -> byTimestamp.putIfAbsent(r.timestamp(), r));
            return Flux.fromIterable(byTimestamp.values());
        });
    }

    private static WeatherRecord toRecord(final WeatherSeriesData data) {
        return new WeatherRecord(
                data.getTemp(), data.getTempFormat(), data.getHum(), data.getPr(), data.getPrFormat(),
                data.getWindDirection(), data.getWindSpeed(), data.getWindSpeedFormat(),
                data.getRainfall(), data.getRainfallFormat(),
                data.getTimestamp().getEpochSecond(), data.getStationId());
    }

    private static WeatherData toWeatherData(final Document d) {
        return new WeatherData(
                asDouble(d.get("temp")), d.getString("tempFormat"),
                asDouble(d.get("hum")), asDouble(d.get("pr")), d.getString("prFormat"),
                asDouble(d.get("windDirection")), asDouble(d.get("windSpeed")), d.getString("windSpeedFormat"),
                asDouble(d.get("rainfall")), d.getString("rainfallFormat"),
                ((Number) d.get("timestamp")).longValue(), d.getString("stationId"));
    }

    private static double asDouble(final Object value) {
        return value == null ? 0d : ((Number) value).doubleValue();
    }
}
