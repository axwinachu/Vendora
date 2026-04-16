package com.booking_service.booking_service.config;

import com.booking_service.booking_service.filter.HeadAuthFilter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
@Slf4j
public class SecurityConfig {

    private final HeadAuthFilter headAuthFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .sessionManagement(s -> s
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth

                        // Customer creates booking
                        .requestMatchers(HttpMethod.POST,  "/booking/create")
                        .hasRole("CUSTOMER")

                        // Both can view their bookings
                        .requestMatchers(HttpMethod.GET,   "/booking/my")
                        .hasAnyRole("CUSTOMER", "PROVIDER")

                        // Admin views all
                        .requestMatchers(HttpMethod.GET,   "/booking/all")
                        .hasRole("ADMIN")

                        // Any role can view a single booking
                        .requestMatchers(HttpMethod.GET,   "/booking/*")
                        .hasAnyRole("CUSTOMER", "PROVIDER", "ADMIN")

                        // Provider actions
                        .requestMatchers(HttpMethod.PATCH, "/booking/*/confirm")
                        .hasRole("PROVIDER")
                        .requestMatchers(HttpMethod.PATCH, "/booking/*/reject")
                        .hasRole("PROVIDER")
                        .requestMatchers(HttpMethod.PATCH, "/booking/*/start")
                        .hasRole("PROVIDER")
                        .requestMatchers(HttpMethod.PATCH, "/booking/*/complete")
                        .hasRole("PROVIDER")

                        // Customer or provider can cancel
                        .requestMatchers(HttpMethod.PATCH, "/booking/*/cancel")
                        .hasAnyRole("CUSTOMER", "PROVIDER")

                        // FIXED: was ADMIN only — payment-service or provider marks paid
                        .requestMatchers(HttpMethod.PUT, "/booking/*/paid")
                        .hasAnyRole("PROVIDER", "ADMIN","CUSTOMER")

                        .anyRequest().authenticated()
                )
                .addFilterBefore(headAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }
}