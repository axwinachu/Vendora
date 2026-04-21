package com.vendora.auth_service.filter;

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
import java.util.Set;

@Component
@Slf4j
public class HeaderAuthFilter extends OncePerRequestFilter {

    private static final Set<String> VALID_ROLES = Set.of("CUSTOMER", "PROVIDER", "ADMIN");

    // ── Skip filter for all non-API paths ───────────────────────
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.startsWith("/v3/api-docs")
                || path.startsWith("/swagger-ui")
                || path.startsWith("/webjars");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String email  = request.getHeader("X-User-Email");
        String role   = request.getHeader("X-User-Role");
        String userId = request.getHeader("X-User-Id");

        if (email != null && role != null && userId != null) {

            // Sanitize inputs
            email  = email.trim();
            userId = userId.trim();
            String normalizedRole = role.trim().toUpperCase();

            // Validate role against allowlist
            if (!VALID_ROLES.contains(normalizedRole)) {
                log.warn("Rejected request — invalid role '{}' for user '{}'", role, email);
                filterChain.doFilter(request, response);
                return;
            }

            if (SecurityContextHolder.getContext().getAuthentication() == null) {
                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(
                                email,           // principal   — use in controllers via auth.getName()
                                userId,          // credentials — use in controllers via auth.getCredentials()
                                List.of(new SimpleGrantedAuthority("ROLE_" + normalizedRole))
                        );
                SecurityContextHolder.getContext().setAuthentication(auth);
                log.debug("Auth set — email: {}, role: {}, userId: {}", email, normalizedRole, userId);
            }

        } else {
            // Log which headers are missing for easier debugging
            log.debug("Skipping auth — missing headers: email={}, role={}, userId={}",
                    email != null ? "present" : "MISSING",
                    role  != null ? "present" : "MISSING",
                    userId!= null ? "present" : "MISSING");
        }

        filterChain.doFilter(request, response);
    }
}