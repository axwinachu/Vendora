package com.vendora.payment_service.config;

import feign.RequestInterceptor;
import jakarta.servlet.Servlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Configuration
public class FeignConfig {
    @Bean
    public RequestInterceptor interceptor(){
        return template->{
            ServletRequestAttributes attrs=(ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs!=null){
                HttpServletRequest request=attrs.getRequest();

                template.header("X-User-Id", request.getHeader("X-User-Id"));
                template.header("X-User-Role", request.getHeader("X-User-Role"));
                template.header("X-User-Email", request.getHeader("X-User-Email"));
            }
        };
    }
}
