package com.vendora.chat_service.client;

import com.vendora.chat_service.config.FeignConfig;
import com.vendora.chat_service.dto.ProviderResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "provider-service", configuration = FeignConfig.class)
public interface ProviderClient {

    @GetMapping("/provider/{id}")
    ProviderResponse getProvider(@PathVariable("id") String id);
}