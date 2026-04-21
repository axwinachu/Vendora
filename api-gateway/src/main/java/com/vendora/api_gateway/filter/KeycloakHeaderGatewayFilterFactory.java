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
                            String email = jwt.getClaimAsString("email");
                            String userId = jwt.getSubject();
                            String extractedRole = extractRole(jwt);
                            final String role = (extractedRole == null || extractedRole.isBlank())
                                    ? "UNKNOWN"
                                    : extractedRole;
                            final String finalEmail = email != null ? email : "";
                            final String finalUserId = userId != null ? userId : "";
                            log.info("JWT subject: {}", finalUserId);
                            log.info("JWT email: {}", finalEmail);
                            log.info("JWT role: {}", role);
                            var mutated = exchange.mutate()
                                    .request(r -> r
                                            .header("X-User-Email", finalEmail)
                                            .header("X-User-Role", role)
                                            .header("X-User-Id", finalUserId)
                                    ).build();

                            return chain.filter(mutated);
                        })
                        .switchIfEmpty(chain.filter(exchange));
    }

    private String extractRole(Jwt jwt) {

        Map<String, Object> resourceAccess = jwt.getClaimAsMap("resource_access");

        if (resourceAccess == null) {
            log.warn("No resource_access in JWT");
            return null;
        }

        log.info("resource_access: {}", resourceAccess);
        String[] priority = {"ADMIN", "PROVIDER", "CUSTOMER"};

        for (String p : priority) {
            for (Map.Entry<String, Object> entry : resourceAccess.entrySet()) {

                String clientName = entry.getKey();
                Map<?, ?> clientData = (Map<?, ?>) entry.getValue();
                Object rolesObj = clientData.get("roles");
                if (rolesObj instanceof List<?>) {
                    List<?> roles = (List<?>) rolesObj;
                    if (roles.contains(p)) {
                        log.info("Selected role '{}' from client '{}'", p, clientName);
                        return p;
                    }
                }
            }
        }

        return null;
    }

    public static class Config {
    }
}