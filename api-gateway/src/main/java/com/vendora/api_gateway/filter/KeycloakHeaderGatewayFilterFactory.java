package com.vendora.api_gateway.filter;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class KeycloakHeaderGatewayFilterFactory
        extends AbstractGatewayFilterFactory<KeycloakHeaderGatewayFilterFactory.Config> {

    public KeycloakHeaderGatewayFilterFactory() {
        super(Config.class);
    }

    @Override
    public GatewayFilter apply(Config config) {

        return (exchange, chain) ->
                ReactiveSecurityContextHolder.getContext()
                        .map(ctx -> ctx.getAuthentication())
                        .filter(auth -> auth instanceof JwtAuthenticationToken)
                        .cast(JwtAuthenticationToken.class)
                        .flatMap(auth -> {

                            Jwt jwt = auth.getToken();
                            String email        = jwt.getClaimAsString("email");
                            String userId       = jwt.getSubject();
                            String extractedRole = extractRole(jwt);

                            final String role       = (extractedRole == null || extractedRole.isBlank())
                                    ? "UNKNOWN" : extractedRole;
                            final String finalEmail  = email  != null ? email  : "";
                            final String finalUserId = userId != null ? userId : "";

                            log.info("JWT subject: {}", finalUserId);
                            log.info("JWT email:   {}", finalEmail);
                            log.info("JWT role:    {}", role);

                            var mutated = exchange.mutate()
                                    .request(r -> r
                                            .header("X-User-Email", finalEmail)
                                            .header("X-User-Role",  role)
                                            .header("X-User-Id",    finalUserId)
                                    ).build();

                            return chain.filter(mutated);
                        })
                        .switchIfEmpty(chain.filter(exchange));
    }

    /**
     * Role extraction strategy:
     *
     * 1. Check realm_access.roles first — this is where realm-level roles live
     *    (ADMIN, PROVIDER, USER). Your backend uses realm roles exclusively.
     *
     * 2. Fall back to resource_access (client roles) — kept for backward
     *    compatibility with other services that may still use client roles
     *    (CUSTOMER etc.).
     *
     * Priority order: ADMIN > PROVIDER > USER > CUSTOMER
     * The first match wins — a user with both ADMIN and USER gets ADMIN.
     */
    private String extractRole(Jwt jwt) {
        String[] priority = {"ADMIN", "PROVIDER", "USER", "CUSTOMER"};

        // ── Step 1: realm_access.roles ────────────────────────────────────────
        Map<String, Object> realmAccess = jwt.getClaimAsMap("realm_access");

        if (realmAccess != null) {
            Object rolesObj = realmAccess.get("roles");
            if (rolesObj instanceof List<?> realmRoles) {
                log.info("realm_access roles: {}", realmRoles);
                for (String candidate : priority) {
                    if (realmRoles.contains(candidate)) {
                        log.info("Selected realm role: '{}'", candidate);
                        return candidate;
                    }
                }
            }
        } else {
            log.warn("No realm_access in JWT");
        }
        Map<String, Object> resourceAccess = jwt.getClaimAsMap("resource_access");

        if (resourceAccess != null) {
            log.info("resource_access: {}", resourceAccess);
            for (String candidate : priority) {
                for (Map.Entry<String, Object> entry : resourceAccess.entrySet()) {
                    Map<?, ?> clientData = (Map<?, ?>) entry.getValue();
                    Object rolesObj = clientData.get("roles");
                    if (rolesObj instanceof List<?> roles && roles.contains(candidate)) {
                        log.info("Selected client role '{}' from '{}'", candidate, entry.getKey());
                        return candidate;
                    }
                }
            }
        } else {
            log.warn("No resource_access in JWT either — role will be UNKNOWN");
        }

        return null;
    }

    public static class Config {
    }
}