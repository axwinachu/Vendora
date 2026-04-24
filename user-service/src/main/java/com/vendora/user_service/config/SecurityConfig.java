package com.vendora.user_service.config;

import com.vendora.user_service.filter.HeaderAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {
    private final HeaderAuthFilter headerAuthFilter;

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .cors(Customizer.withDefaults())
                .csrf(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.POST, "/user/create").permitAll()
                        .requestMatchers(HttpMethod.GET, "/user/all").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/user/email/**").hasAnyRole("USER", "PROVIDER", "ADMIN")
                        .requestMatchers(HttpMethod.GET, "/user/district/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/user/*").permitAll()
                        .requestMatchers(HttpMethod.POST, "/user/*/photo").hasAnyRole("USER", "PROVIDER", "ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/user/*/location/gps").hasAnyRole("USER", "PROVIDER", "ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/user/*/location/address").hasAnyRole("USER", "PROVIDER", "ADMIN")
                        .anyRequest().authenticated()
                )
                .addFilterBefore(headerAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }
}
