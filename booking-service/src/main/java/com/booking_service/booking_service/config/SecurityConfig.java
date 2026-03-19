package com.booking_service.booking_service.config;

import com.booking_service.booking_service.filter.HeadAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SecurityConfig {
    private final HeadAuthFilter headAuthFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http.csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(s->s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth

                        // Customer creates booking
                        .requestMatchers(HttpMethod.POST, "/booking/create")
                        .hasRole("CUSTOMER")

                        // Customer or provider view their bookings
                        .requestMatchers(HttpMethod.GET, "/booking/my")
                        .hasAnyRole("CUSTOMER", "PROVIDER")
                        .requestMatchers(HttpMethod.GET, "/booking/{id}")
                        .hasAnyRole("CUSTOMER", "PROVIDER", "ADMIN")

                        // Admin views all bookings
                        .requestMatchers(HttpMethod.GET, "/booking/all")
                        .hasRole("ADMIN")

                        // Provider confirms or rejects
                        .requestMatchers(HttpMethod.PATCH, "/booking/*/confirm")
                        .hasRole("PROVIDER")
                        .requestMatchers(HttpMethod.PATCH, "/booking/*/reject")
                        .hasRole("PROVIDER")

                        // Provider updates progress
                        .requestMatchers(HttpMethod.PATCH, "/booking/*/start")
                        .hasRole("PROVIDER")
                        .requestMatchers(HttpMethod.PATCH, "/booking/*/complete")
                        .hasRole("PROVIDER")

                        // Customer or provider can cancel
                        .requestMatchers(HttpMethod.PATCH, "/booking/*/cancel")
                        .hasAnyRole("CUSTOMER", "PROVIDER")

                        // Internal — called by payment-service
                        .requestMatchers(HttpMethod.PATCH, "/booking/*/paid")
                        .hasAnyRole("ADMIN", "CUSTOMER")

                        .anyRequest().authenticated()
                ).addFilterBefore(headAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .build();

    }
}
