package com.nimbus.weatherapi.model;

public record Location(
        String _id,
        String locationName,
        Double lon,
        Double lat
) {
}
