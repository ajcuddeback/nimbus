# Nimbus Weather API — Client Contract

**Audience:** an agent updating a client application that consumes this API.
**Status:** current as of commit `19e7c2e` (time-series migration).
**Base URL:** `http://localhost:8080` in dev; behind nginx in prod.

This document is the complete client-facing contract. The API was migrated from a persisted
hourly-document model to a MongoDB **time-series** collection of raw minute readings, with all
aggregation now computed at read time. Three things changed in ways that **will break existing
clients**. They are listed first.

---

## 1. Breaking changes

### 1.1 `GET /weatherData/current` changed from an array to a wrapped single object

This is the big one. It changed twice over: the cardinality changed, *and* the payload gained a wrapper.

**Before** — an array of the most recent minute readings, served from an in-memory cache:

```json
[
  { "temp": 22.4, "timestamp": 1754680320, "stationId": "80bb...", "...": "..." },
  { "temp": 22.5, "timestamp": 1754680380, "stationId": "80bb...", "...": "..." }
]
```

**Now** — a single reading, wrapped with its age:

```json
{
  "reading": { "temp": 22.4, "timestamp": 1754680320, "stationId": "80bb...", "...": "..." },
  "stale": false,
  "ageSeconds": 37
}
```

Two distinct migrations are needed depending on what the client was using the old array for:

| If the client used the old `/current` array to… | Migrate to |
| --- | --- |
| Show the newest reading (e.g. `data[data.length - 1]` or `data[0]`) | `GET /weatherData/current` → read `.reading` |
| Plot the last hour of minute-by-minute readings | `GET /weatherData/hour` (new endpoint, §3.2) |

A client that did `response.map(...)` or `response.length` against `/current` will now throw or
silently misbehave, since the response is an object. **Grep every consumer for `/weatherData/current`
and check which of the two uses applies — do not assume.**

### 1.2 `WeatherData.id` no longer exists

`WeatherData` was a persisted Mongo document with an `@Id`, so responses carried an `id` string.
Hourly data is now computed at read time and has no document identity. The field is **absent** from
`/weatherData` and `/weatherData/today` responses.

Clients using `id` as a list key (React `key`, Angular `trackBy`, Vue `:key`) must switch to
`timestamp`, which is unique per station per hour and is a stable sort key.

### 1.3 An empty body is now a meaningful response

`/weatherData/current` returns **HTTP 200 with a zero-length body** when the station has never
reported. This is distinct from "reported a while ago" (which returns a normal body with
`stale: true`). See §4 for why the distinction matters to the UI.

Note for `fetch`-based clients: `response.json()` on an empty body **throws** a `SyntaxError`. Check
`response.headers.get('content-length') === '0'` or guard the parse. Angular's `HttpClient` handles
this for you and yields `null`.

---

## 2. Shared data types

### 2.1 `WeatherRecord` — one raw minute reading

Exactly what the station published at one moment in time. Never aggregated.

```ts
interface WeatherRecord {
  temp: number;             // degrees, unit given by tempFormat
  tempFormat: string;       // "C"
  hum: number;              // relative humidity, percent
  pr: number;               // pressure, unit given by prFormat
  prFormat: string;         // "hPa"
  windDirection: number;    // degrees, 0–360, 0 = north
  windSpeed: number;        // unit given by windSpeedFormat
  windSpeedFormat: string;  // "mph"
  rainfall: number;         // unit given by rainfallFormat
  rainfallFormat: string;   // "mm"
  timestamp: number;        // EPOCH SECONDS — the moment of the reading
  stationId: string;
}
```

### 2.2 `WeatherData` — one hourly aggregate

Same field names as `WeatherRecord`, but every value is aggregated over an hour, and `timestamp`
means something different. Because the two types are structurally identical, **TypeScript will not
catch a mix-up** — keep them as separate named types and be deliberate about which endpoint feeds which.

```ts
interface WeatherData {
  temp: number;             // MEAN over the hour, rounded to 2dp
  tempFormat: string;
  hum: number;              // MEAN over the hour
  pr: number;               // MEAN over the hour
  prFormat: string;
  windDirection: number;    // CIRCULAR mean, normalized to [0, 360)
  windSpeed: number;        // MEAN over the hour
  windSpeedFormat: string;
  rainfall: number;         // SUM over the hour, not a mean
  rainfallFormat: string;
  timestamp: number;        // EPOCH SECONDS at the START of the hour bucket
  stationId: string;
  // NOTE: no `id` field — see §1.2
}
```

> **Version note.** Between the migration commit `19e7c2e` and this document, `stationId` serialized
> as `null` on both aggregate endpoints (`/weatherData` and `/weatherData/today`) — a dropped field
> in the aggregation pipeline. Fixed in the working tree; the fix requires an API restart to take
> effect. If a client sees `stationId: null` in hourly data, it is talking to an API built from
> `19e7c2e` and should not work around it client-side. Raw readings from `/current` and `/hour` were
> never affected.

Two aggregation details that matter when rendering:

- **`rainfall` is summed, everything else is averaged.** Summing an already-summed hourly rainfall
  against live minute readings double-counts. If a client shows a running rain total, it must not
  add `/hour` readings on top of `/today` rainfall for hours already covered.
- **`windDirection` is a circular mean**, not an arithmetic one — averaging 350° and 10° yields 0°,
  not 180°. Clients should not re-average wind direction across buckets themselves.

### 2.3 `CurrentWeather` — newest reading plus freshness

```ts
interface CurrentWeather {
  reading: WeatherRecord;
  stale: boolean;      // true once the reading is older than the server's freshness window
  ageSeconds: number;  // reading age at the moment the server answered; clamped at 0
}
```

### 2.4 `WeatherSummary`

```ts
interface WeatherSummary {
  summary: string;
  severity: string;   // e.g. "info"
}
```

### 2.5 `WeatherStations`

```ts
interface WeatherStations {
  id: string;
  location: { type: 'Point'; coordinates: [number, number] };  // GeoJSON — [lon, lat]
  stationName: string;
  stationId: string;
}
```

### 2.6 Timestamps

**Every `timestamp` in every response is epoch SECONDS, not milliseconds.** JavaScript clients must
multiply by 1000: `new Date(reading.timestamp * 1000)`. A raw `new Date(timestamp)` silently yields a
date in January 1970 rather than erroring, so this is easy to miss in review.

---

## 3. Endpoints

### 3.1 `GET /weatherData/current` — newest reading with freshness

| | |
| --- | --- |
| Query params | `stationId` (required) |
| 200 | `CurrentWeather` |
| 200, empty body | Station has never reported any reading |

```http
GET /weatherData/current?stationId=80bb40b5fce97afec61866080fa08e01
```

```json
{
  "reading": {
    "temp": 31.2, "tempFormat": "C",
    "hum": 62.5,
    "pr": 1011.4, "prFormat": "hPa",
    "windDirection": 137.5,
    "windSpeed": 4.2, "windSpeedFormat": "mph",
    "rainfall": 0.0, "rainfallFormat": "mm",
    "timestamp": 1754680320,
    "stationId": "80bb40b5fce97afec61866080fa08e01"
  },
  "stale": false,
  "ageSeconds": 37
}
```

### 3.2 `GET /weatherData/hour` — this hour's raw minute readings *(new)*

Every raw reading from the top of the current hour **in the caller's timezone** through now, oldest
first, de-duplicated by exact timestamp. This is the endpoint that replaces the old `/current` array
for charting.

| | |
| --- | --- |
| Query params | `stationId` (required), `timezone` (required, IANA name e.g. `America/New_York`) |
| 200 | `WeatherRecord[]` — may be `[]` early in the hour |

`timezone` has no default and is **not** optional; omitting it is a 400. An invalid zone name is a
500 (`ZoneId.of` throws). Browser clients should send
`Intl.DateTimeFormat().resolvedOptions().timeZone`.

Note this window resets on the hour: at 14:01 local it returns roughly one minute of data, not the
trailing 60 minutes.

### 3.3 `GET /weatherData/today` — today's hourly aggregates

| | |
| --- | --- |
| Query params | `stationId` (required), `timezone` (required, IANA name) |
| 200 | `WeatherData[]`, **ascending** by hour |

Buckets are cut on **the caller's local hours**. Covers local midnight through end of day; only
elapsed hours are present. Because these are computed at read time, the in-progress hour **is
included** and grows as the hour fills — a client does not need to top it up with live readings.

### 3.4 `GET /weatherData` — paginated historical hourly aggregates

| | |
| --- | --- |
| Query params | `stationId` (required), `page` (default `0`), `size` (default `20`) |
| 200 | `Page<WeatherData>`, **descending** by hour (newest first) |

Two traps here:

- **The `sort` query param is ignored.** Ordering is fixed descending in the aggregation pipeline.
  A client passing `sort=timestamp,asc` gets descending data with no error.
- **Buckets are cut on UTC hours, not the caller's timezone** — unlike `/today` (§3.3), this
  endpoint takes no `timezone` param. For stations at non-UTC offsets, a "day" of these buckets does
  not line up with a local calendar day. Do not mix these two endpoints' buckets in one series.

The response is a Spring `PageImpl` serialized by Jackson. The envelope below was captured from a
live response, with `size=1` for brevity. Note the envelope is not pinned by any DTO in this
codebase — it is Spring Data's default serialization, so treat `content` and `totalElements` as the
stable contract and re-verify any other field after a Spring Data upgrade:

```json
{
  "content": [ { "temp": 32.9, "timestamp": 1786219200, "stationId": "80bb...", "...": "..." } ],
  "pageable": {
    "pageNumber": 0, "pageSize": 1, "offset": 0, "paged": true, "unpaged": false,
    "sort": { "empty": true, "sorted": false, "unsorted": true }
  },
  "totalElements": 8703,
  "totalPages": 8703,
  "number": 0,
  "size": 1,
  "numberOfElements": 1,
  "sort": { "empty": true, "sorted": false, "unsorted": true },
  "first": true,
  "last": false,
  "empty": false
}
```

`totalElements` counts **distinct hour buckets** for the station, not raw readings — so it is the
number of hours the station has data for, not the number of minute readings.

Any `sort` object in the envelope reflects the *requested* pageable, which this endpoint ignores
(see above). It does not describe the actual ordering of `content`.

### 3.5 `GET /weatherSummary` — cached AI summary

| | |
| --- | --- |
| Query params | `stationId` (required) |
| 200 | `WeatherSummary` |

Never 404s and never returns an empty body. Before the first successful generation it returns the
placeholder `{"summary": "No summary available yet", "severity": "info"}` — clients should treat that
string as a "not ready" state rather than displaying it as analysis.

Regenerated on a 30-minute schedule. **Generation is skipped while the station is stale**, so during
an outage this endpoint keeps serving the last good summary rather than narrating stale conditions as
current. A client showing this text next to an offline badge should make clear the summary is not live.

### 3.6 `GET /weatherStations` — stations near a point

| | |
| --- | --- |
| Query params | `lon` (required), `lat` (required), `maxDistance` (default `1000`), `page`, `size` |
| 200 | `Page<WeatherStations>` |

### 3.7 `/report`

The `/report` controller exists but declares no endpoints. Nothing to consume; no client action.

---

## 4. Staleness — behavioural contract

The station publishes roughly once a minute. If it drops off, `/current` keeps returning the last
reading it ever sent, forever. `stale` is the server's verdict on whether that reading can still be
presented as current.

The freshness window is server-side config (`weather.current.stale-after`, default `PT5M`,
overridable via the `CURRENT_STALE_AFTER` env var). **Clients should not hard-code 5 minutes as
authoritative** — treat `stale` as the source of truth.

### Required client behaviour

1. **When `stale` is true, no UI element may present the reading as live.** Remove "LIVE" badges,
   stop pulse/streaming animations, and drop any "as of now" phrasing. Show the reading's age
   instead. Dimming the values is the reference treatment.
2. **Do not render weather *effects* from a stale reading.** Animated rain or lightning driven by a
   reading from hours ago asserts current conditions that may have long passed. The reference client
   falls back to a plain sky and lets the offline badge carry the explanation.
3. **Empty body ≠ stale.** No reading at all is "waiting for data" (a station that has never
   reported); stale is "offline, last seen N ago". These deserve different empty states.
4. **Re-check age locally between polls.** `stale` and `ageSeconds` are computed when the server
   answers. A client polling every 30s that trusts only the response would keep showing "live" for up
   to a full interval after the station dies. Recompute from the absolute timestamp on a local timer:

   ```ts
   const elapsed = Math.max(0, nowSeconds - current.reading.timestamp);
   const isStale = current.stale || elapsed > STALE_AFTER_SECONDS;
   ```

   The server verdict still wins — the local check only ever escalates fresh → stale, never the
   reverse. Clamp at zero so a station clock running slightly fast can't produce a negative age.

---

## 5. Errors

Standard Spring Boot error body on 4xx/5xx:

```json
{
  "timestamp": "2026-08-08T19:39:39.331+00:00",
  "path": "/weatherData/current",
  "status": 500,
  "error": "Internal Server Error",
  "requestId": "86f5d8b0-5",
  "message": "..."
}
```

- Missing a required query param → **400**.
- Unknown `stationId` is **not** an error: `/current` returns an empty body, the array endpoints
  return `[]`, and `/weatherData` returns an empty page. A client must not treat "no data" as failure.
- An invalid IANA `timezone` string → **500**, not 400.

Clients should distinguish transport/server failure from the legitimately-empty states above;
collapsing them into one error banner makes an offline station look like a broken backend.

---

## 6. CORS

The CORS filter is registered **only under the `dev` profile**, reading allowed origins from
`cors.allowed-origins` (env var `ALLOWED_ORIGINS`, comma-separated) in
`application-dev.properties`. All methods and headers are allowed, with credentials enabled.

Under the `prod` profile (`SPRING_PROFILES_ACTIVE=prod`, set in `docker-compose.yml`) **no CORS bean
is registered at all** — cross-origin requests are expected to be same-origin via the nginx reverse
proxy.

So: a new client app on a new origin needs its origin added to `ALLOWED_ORIGINS` for local dev, and
needs to be routed through nginx in prod. Verify the nginx config before assuming a new origin will
work in production — a browser client on an unproxied origin will fail CORS with no server-side error.

---

## 7. Migration checklist

For each client application:

- [ ] Find every call to `/weatherData/current`. Decide per call site whether it wanted the newest
      reading (→ `.reading`) or the last hour of readings (→ `/weatherData/hour`, §1.1).
- [ ] Update the `current` response type to `CurrentWeather`; the value is now nullable via an empty body.
- [ ] Add `timezone` to any new `/weatherData/hour` call — required, no default.
- [ ] Remove all uses of `WeatherData.id`; key lists by `timestamp` instead (§1.2).
- [ ] Add the offline/stale UI state and remove live indicators when `stale` (§4).
- [ ] Add a separate "never reported" empty state for the empty-body case (§1.3).
- [ ] Add a local age re-check on a timer so staleness isn't limited to poll boundaries (§4.4).
- [ ] Verify no code re-sorts or re-averages `/weatherData` results assuming ascending order or
      local-timezone buckets (§3.4).
- [ ] Confirm `timestamp * 1000` before any `new Date(...)` (§2.6).
- [ ] Register the client's origin in `ALLOWED_ORIGINS` for dev (§6).
```
