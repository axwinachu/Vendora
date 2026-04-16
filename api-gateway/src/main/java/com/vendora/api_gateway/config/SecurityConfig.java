package com.vendora.api_gateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;

@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    @Bean
    public SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http) {
        return http
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                // ── Enable CORS (reads config from application.yml) ────
                .cors(Customizer.withDefaults())

                .authorizeExchange(auth -> auth

                        // ── Preflight requests ─────────────────────────
                        .pathMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .pathMatchers("/message/**").permitAll()
                        .pathMatchers("/ws/**").permitAll()
                        // ── Protected services — JWT required ──────────
                        .pathMatchers("/user/**").authenticated()
                        .pathMatchers("/provider/**").authenticated()
                        .pathMatchers("/booking/**").authenticated()
                        .anyExchange().authenticated()
                )
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()))
                .build();
    }
}
