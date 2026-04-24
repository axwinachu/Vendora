package com.vendora.review_service.config;

import com.vendora.review_service.filter.HeadAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {
    private final HeadAuthFilter headAuthFilter;
    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http.
                authorizeHttpRequests(auth-> auth
                        .requestMatchers(HttpMethod.POST,"/review/add").hasRole("USER")
                        .requestMatchers(HttpMethod.GET,"/review/provider/*").hasAnyRole("USER","PROVIDER","ADMIN")
                        .requestMatchers(HttpMethod.GET,"/review/provider/*/average").hasAnyRole("USER","PROVIDER","ADMIN")
                        .anyRequest().authenticated()
                ).
                addFilterBefore(headAuthFilter, UsernamePasswordAuthenticationFilter.class).
                csrf(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .sessionManagement(s->s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .cors(Customizer.withDefaults())
                .build();


    }
}
