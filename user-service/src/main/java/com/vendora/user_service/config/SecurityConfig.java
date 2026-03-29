package com.vendora.user_service.config;

import com.vendora.user_service.filter.HeaderAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
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


                        .requestMatchers(HttpMethod.POST, "/user/create").permitAll()


                        .requestMatchers(HttpMethod.GET, "/user/*").hasAnyRole("CUSTOMER", "PROVIDER", "ADMIN")


                        .requestMatchers(HttpMethod.GET, "/user/email/**").hasAnyRole("CUSTOMER", "PROVIDER", "ADMIN")

                        .requestMatchers(HttpMethod.GET, "/user/all").permitAll()

                        .requestMatchers(HttpMethod.GET, "/user/district/**").hasRole("ADMIN")

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
