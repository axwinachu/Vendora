package com.vendora.user_service.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class GeocodeingService {
    private final RestTemplate restTemplate = new RestTemplate();

    private static final String NOMINATIM_URL =
            "https://nominatim.openstreetmap.org/search";

    // Coimbatore district bounding box
    private static final double CBE_LAT_MIN = 10.70;
    private static final double CBE_LAT_MAX = 11.50;
    private static final double CBE_LNG_MIN = 76.70;
    private static final double CBE_LNG_MAX = 77.40;

    // Palakkad district bounding box
    private static final double PKD_LAT_MIN = 10.40;
    private static final double PKD_LAT_MAX = 11.20;
    private static final double PKD_LNG_MIN = 76.40;
    private static final double PKD_LNG_MAX = 77.00;

    public GeoResult geocode(String address) {
        String url = UriComponentsBuilder.fromHttpUrl(NOMINATIM_URL)
                .queryParam("q", address + ", Tamil Nadu, India")
                .queryParam("format", "json")
                .queryParam("limit", "1")
                .queryParam("countrycodes", "in")
                .build()
                .toUriString();

        try {
            // Nominatim requires a User-Agent header — use your app name
            org.springframework.http.HttpHeaders headers =
                    new org.springframework.http.HttpHeaders();
            headers.set("User-Agent", "Vendora/1.0");

            org.springframework.http.HttpEntity<Void> entity =
                    new org.springframework.http.HttpEntity<>(headers);

            org.springframework.http.ResponseEntity<List> response =
                    restTemplate.exchange(
                            url,
                            org.springframework.http.HttpMethod.GET,
                            entity,
                            List.class
                    );

            List<?> results = response.getBody();

            if (results == null || results.isEmpty()) {
                throw new RuntimeException(
                        "Address not found. Please enter a more specific address.");
            }

            Map<?, ?> first = (Map<?, ?>) results.get(0);

            double lat = Double.parseDouble((String) first.get("lat"));
            double lng = Double.parseDouble((String) first.get("lon"));

            log.info("Geocoded '{}' → lat={}, lng={}", address, lat, lng);

            String district = detectDistrict(lat, lng);
            if (district == null) {
                throw new RuntimeException(
                        "This address is outside Coimbatore and Palakkad. " +
                                "Vendora is currently available only in these two districts.");
            }

            return new GeoResult(lat, lng, district);

        } catch (RuntimeException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Geocoding error: {}", ex.getMessage());
            throw new RuntimeException(
                    "Could not fetch coordinates. Please try again.");
        }
    }

    private String detectDistrict(double lat, double lng) {
        if (lat >= CBE_LAT_MIN && lat <= CBE_LAT_MAX
                && lng >= CBE_LNG_MIN && lng <= CBE_LNG_MAX) {
            return "COIMBATORE";
        }
        if (lat >= PKD_LAT_MIN && lat <= PKD_LAT_MAX
                && lng >= PKD_LNG_MIN && lng <= PKD_LNG_MAX) {
            return "PALAKKAD";
        }
        return null;
    }

    public record GeoResult(double latitude, double longitude, String district) {}
}

