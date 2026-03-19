package com.booking_service.booking_service.feign;

import com.booking_service.booking_service.dto.ProviderResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "provider-service")
public interface ProviderServiceClient {
    @GetMapping("/provider/{id}")
    ProviderResponse getProviderById(@PathVariable String id);
}
