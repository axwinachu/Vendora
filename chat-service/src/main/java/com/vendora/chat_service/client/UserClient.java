package com.vendora.chat_service.client;

import com.vendora.chat_service.config.FeignConfig;
import com.vendora.chat_service.dto.UserResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(
        name = "user-service",
        configuration = FeignConfig.class
)
public interface UserClient {

    @GetMapping("/user/{id}")
    UserResponse getUserById(@PathVariable("id") String userId);
}