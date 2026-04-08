package com.vendora.payment_service.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;

@FeignClient(name = "booking-service")
public interface BookingServiceClient {

    // Mark booking as PAID after successful payment
    @PatchMapping("/booking/{id}/paid")
    void markPaid(
        @PathVariable String id,
        @RequestHeader("X-User-Role") String role
    );
}