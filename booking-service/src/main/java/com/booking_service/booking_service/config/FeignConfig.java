package com.booking_service.booking_service.config;

import feign.RequestInterceptor;
import feign.RequestTemplate;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Configuration
public class FeignConfig {

    @Bean
    public RequestInterceptor headerPropagationInterceptor() {
        return (RequestTemplate template) -> {
            ServletRequestAttributes attrs =
                (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();

            if (attrs != null) {
                HttpServletRequest request = attrs.getRequest();
                propagate(template, request, "X-User-Id");
                propagate(template, request, "X-User-Role");
                propagate(template, request, "X-User-Email");
            }
        };
    }

    private void propagate(RequestTemplate template,
                           HttpServletRequest request, String header) {
        String value = request.getHeader(header);
        if (value != null) {
            template.header(header, value);
        }
    }
}