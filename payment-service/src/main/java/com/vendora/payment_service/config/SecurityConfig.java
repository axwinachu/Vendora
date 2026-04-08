package com.vendora.payment_service.config;

import com.vendora.payment_service.filter.HeadAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final HeadAuthFilter headerAuthFilter;

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(s -> s
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Webhook is public — Razorpay calls it
                        .requestMatchers(HttpMethod.POST, "/payment/webhook").permitAll()

                        // Provider verifies OTP
                        .requestMatchers(HttpMethod.POST, "/payment/verify-otp")
                        .hasRole("PROVIDER")

                        // Provider or customer can view payment status
                        .requestMatchers(HttpMethod.GET, "/payment/booking/**")
                        .hasAnyRole("CUSTOMER", "PROVIDER", "ADMIN")

                        // Resend OTP — customer or provider
                        .requestMatchers(HttpMethod.POST, "/payment/resend-otp")
                        .hasAnyRole("CUSTOMER", "PROVIDER")

                        // Admin views all payments
                        .requestMatchers(HttpMethod.GET, "/payment/all")
                        .hasRole("ADMIN")

                        .anyRequest().authenticated()
                )
                .addFilterBefore(headerAuthFilter,
                        UsernamePasswordAuthenticationFilter.class)
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .build();
    }
}