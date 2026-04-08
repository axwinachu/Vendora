package com.vendora.payment_service.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

import java.util.Base64;

@Configuration
public class RazorpayConfig {

    @Value("${razorpay.key-id}")
    private String keyId;

    @Value("${razorpay.key-secret}")
    private String keySecret;

    @Bean
    public RestClient razorpayRestClient() {
        // Razorpay uses HTTP Basic Auth: Base64(key_id:key_secret)
        String credentials = keyId + ":" + keySecret;
        String auth = Base64.getEncoder()
                .encodeToString(credentials.getBytes());

        return RestClient.builder()
                .baseUrl("https://api.razorpay.com/v1")
                .defaultHeader("Authorization", "Basic " + auth)
                .defaultHeader("Content-Type",  "application/json")
                .defaultHeader("Accept",         "application/json")
                .build();
    }
}