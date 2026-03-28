package com.example.provider_service.config;

import com.example.provider_service.filter.HeaderAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.stereotype.Component;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {
    private final HeaderAuthFilter headerAuthFilter;
    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http.authorizeHttpRequests(auth -> auth

                        // ── Fully public — no token needed ───────────────────
                        .requestMatchers(HttpMethod.GET, "/provider/nearby").permitAll()
                        .requestMatchers(HttpMethod.GET, "/provider/top-rated/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/provider/district/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/provider/category/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/provider/*").permitAll()
                        .requestMatchers(HttpMethod.GET,"/provider/me").hasRole("PROVIDER")
                        // ── Any authenticated user can view ──────────────────
                        .requestMatchers(HttpMethod.GET, "/provider/all").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/provider/user/**").hasAnyRole("CUSTOMER", "PROVIDER", "ADMIN")

                        // ── Provider creates their own profile ───────────────
                        .requestMatchers(HttpMethod.POST, "/provider/create").hasAnyRole("PROVIDER", "ADMIN")

                        // ── Provider updates their own profile ───────────────
                        .requestMatchers(HttpMethod.PUT, "/provider/*").hasAnyRole("PROVIDER", "ADMIN")

                        // ── Provider toggles their own availability ──────────
                        .requestMatchers(HttpMethod.PATCH, "/provider/*/availability").hasAnyRole("PROVIDER", "ADMIN")

                        // ── Provider manages their own photos ────────────────
                        .requestMatchers(HttpMethod.POST,   "/provider/*/photo").hasAnyRole("PROVIDER", "ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/provider/*/photo").hasAnyRole("PROVIDER", "ADMIN")

                        // ── Provider manages their own portfolio ─────────────
                        .requestMatchers(HttpMethod.POST,   "/provider/*/portfolio").hasAnyRole("PROVIDER", "ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/provider/*/portfolio").hasAnyRole("PROVIDER", "ADMIN")

                        // ── Admin only ───────────────────────────────────────
                        .requestMatchers(HttpMethod.PATCH,  "/provider/*/status").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/provider/*").hasRole("ADMIN")

                        // ── Called by review-service internally ──────────────
                        .requestMatchers(HttpMethod.PATCH, "/provider/*/rating").hasAnyRole("CUSTOMER", "ADMIN")

                        .anyRequest().authenticated()
                )
                .addFilterBefore(headerAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session->session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable).build();
    }
}
