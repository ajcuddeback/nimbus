package com.nimbus.weatherapi.model;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;

public record WeatherStationRepresentation(
        String stationId,
        String stationName,
        double latitude,
        double longitude,
        String timezone,       // e.g. "America/New_York"
        Double elevation,      // meters above sea level
        String visibility,     // e.g. PUBLIC | PRIVATE | INTERNAL
        String city,
        String state,
        String county,
        String country,
        String postalCode,
        Instant commissionedAt,
        Instant retiredAt,
        String landUse         // e.g. RESIDENTIAL | AGRICULTURE | INDUSTRIAL
) {
    public String generateStationId() throws NoSuchAlgorithmException {
        String combinedData = city + ";" + state + ";" + country + ";" + longitude + ";" + latitude;

        MessageDigest md = MessageDigest.getInstance("MD5");
        md.update(combinedData.getBytes());

        byte[] digest = md.digest();
        StringBuilder sb = new StringBuilder();
        for (byte b : digest) {
            sb.append(String.format("%02x", b)); // byte → hex
        }
        return sb.toString();
    }
}
