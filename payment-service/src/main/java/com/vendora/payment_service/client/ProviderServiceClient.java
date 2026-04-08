package com.vendora.payment_service.client;

import com.vendora.payment_service.dto.ProviderResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestHeader;

@FeignClient(name = "provider-service")
public interface ProviderServiceClient {

    @GetMapping("/provider/{id}")
    ProviderResponse getProviderById(@PathVariable String id);

    // Update provider's total earnings after payout
    @PatchMapping("/provider/{id}/earnings")
    void updateEarnings(
        @PathVariable String id,
        @RequestHeader("amount") Long amountPaise
    );
}