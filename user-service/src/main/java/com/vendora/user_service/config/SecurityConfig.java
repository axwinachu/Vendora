package com.vendora.user_service.config;

import com.vendora.user_service.filter.HeaderAuthFilter;
import jakarta.ws.rs.HttpMethod;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
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
        return http.csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth

                        // POST /user/create — called by auth-service after OTP verify
                        // internal call so permit all
                        .requestMatchers(HttpMethod.POST, "/user/create").permitAll()

                        // GET /user/{id} — customer, provider, admin can view
                        .requestMatchers(HttpMethod.GET, "/user/{id}").hasAnyRole("CUSTOMER", "PROVIDER", "ADMIN")

                        // GET /user/email/{email} — all roles, used internally by other services
                        .requestMatchers(HttpMethod.GET, "/user/email/**").hasAnyRole("CUSTOMER", "PROVIDER", "ADMIN")

                        // GET /user/all — admin only
                        .requestMatchers(HttpMethod.GET, "/user/all").hasRole("ADMIN")

                        // GET /user/district/{district} — admin only
                        .requestMatchers(HttpMethod.GET, "/user/district/**").hasRole("ADMIN")

                        // POST /user/{id}/photo — customer or provider uploads own photo
                        .requestMatchers(HttpMethod.POST, "/user/*/photo").hasAnyRole("CUSTOMER", "PROVIDER", "ADMIN")

                        // PATCH /user/{id}/location/gps — customer or provider updates own location
                        .requestMatchers(HttpMethod.PATCH, "/user/*/location/gps").hasAnyRole("CUSTOMER", "PROVIDER", "ADMIN")

                        // PATCH /user/{id}/location/address — customer or provider updates own location
                        .requestMatchers(HttpMethod.PATCH, "/user/*/location/address").hasAnyRole("CUSTOMER", "PROVIDER", "ADMIN")

                        .anyRequest().authenticated()
                )
                .addFilterBefore(headerAuthFilter,UsernamePasswordAuthenticationFilter.class)
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .build();

    }
}
