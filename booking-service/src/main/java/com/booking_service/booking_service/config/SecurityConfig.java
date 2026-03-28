package com.booking_service.booking_service.config;

import com.booking_service.booking_service.filter.HeadAuthFilter;
import lombok.RequiredArgsConstructor;
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

                        .requestMatchers(HttpMethod.POST, "/booking/create")
                        .hasRole("CUSTOMER")

                        .requestMatchers(HttpMethod.GET, "/booking/my")
                        .hasAnyRole("CUSTOMER", "PROVIDER")
                        .requestMatchers(HttpMethod.GET, "/booking/all")
                        .hasRole("ADMIN")

                        .requestMatchers(HttpMethod.PATCH, "/booking/*/confirm")
                        .hasRole("PROVIDER")
                        .requestMatchers(HttpMethod.PATCH, "/booking/*/reject")
                        .hasRole("PROVIDER")
                        .requestMatchers(HttpMethod.PATCH, "/booking/*/start")
                        .hasRole("PROVIDER")
                        .requestMatchers(HttpMethod.PATCH, "/booking/*/complete")
                        .hasRole("PROVIDER")

                        .requestMatchers(HttpMethod.PATCH, "/booking/*/cancel")
                        .hasAnyRole("CUSTOMER", "PROVIDER")


                        .requestMatchers(HttpMethod.PATCH, "/booking/*/paid")
                        .hasRole("ADMIN")


                        .requestMatchers(HttpMethod.GET, "/booking/*")
                        .hasAnyRole("CUSTOMER", "PROVIDER", "ADMIN")

                        .anyRequest().authenticated()
                )
                .addFilterBefore(headAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }
}