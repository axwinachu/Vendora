package com.vendora.payment_service.feign;

import com.vendora.payment_service.config.FeignConfig;
import com.vendora.payment_service.dto.BookingResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;

@FeignClient(name = "booking-service",configuration = FeignConfig.class)
public interface BookingClient {

    @GetMapping("/booking/{id}")
    BookingResponse getBooking(@PathVariable String id);

    @PutMapping("/booking/{id}/paid")
    void markPaid(@PathVariable String id);
}
