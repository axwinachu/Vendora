package com.vendora.review_service.feign;

import com.vendora.review_service.dto.BookingResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "booking-service")
public interface BookingClient {
    @GetMapping("/booking/{id}")
    BookingResponse getBookingById(@PathVariable String id);
}
