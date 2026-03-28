package com.booking_service.booking_service.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Objects;

@Slf4j
@Component
public class HeadAuthFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String email  = request.getHeader("X-User-Email");
        String role   = request.getHeader("X-User-Role");
        String userId = request.getHeader("X-User-Id");

        log.info("email {} role {} userId {}", email, role, userId);

        if (userId != null && role != null
                && SecurityContextHolder.getContext().getAuthentication() == null) {

            // ADD THIS ↓
            log.info(">>> Building auth for role: ROLE_{}", role);

            UsernamePasswordAuthenticationToken auth =
                    new UsernamePasswordAuthenticationToken(
                            userId, null,
                            List.of(new SimpleGrantedAuthority("ROLE_" + role))
                    );
            SecurityContextHolder.getContext().setAuthentication(auth);

            // ADD THIS ↓
            log.info(">>> Auth set: {}", SecurityContextHolder.getContext()
                    .getAuthentication().getAuthorities());
        } else {
            // ADD THIS ↓
            log.warn(">>> Auth NOT set — userId: {}, role: {}, existingAuth: {}",
                    userId, role,
                    SecurityContextHolder.getContext().getAuthentication());
        }

        filterChain.doFilter(request, response);
    }
}
