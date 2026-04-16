package com.vendora.chat_service.config;

import feign.RequestInterceptor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Slf4j
@Configuration
public class FeignConfig {
    @Bean
    public RequestInterceptor requestInterceptor() {
        return requestTemplate -> {
            var attrs = RequestContextHolder.getRequestAttributes();
            if (attrs instanceof ServletRequestAttributes sra) {
                var req = sra.getRequest();
                requestTemplate.header("X-User-Id",    req.getHeader("X-User-Id"));
                requestTemplate.header("X-User-Email", req.getHeader("X-User-Email"));
                requestTemplate.header("X-User-Role",  req.getHeader("X-User-Role"));
            } else {
                log.warn("FeignConfig: No servlet context — headers not forwarded");
            }
        };
    }
}