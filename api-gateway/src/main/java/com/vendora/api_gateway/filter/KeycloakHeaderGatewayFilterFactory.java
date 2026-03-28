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
public class KeycloakHeaderGatewayFilterFactory extends AbstractGatewayFilterFactory<KeycloakHeaderGatewayFilterFactory.Config> {
    public KeycloakHeaderGatewayFilterFactory(){
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

                            String role = "CUSTOMER"; // default

                            // ✅ Extract roles from resource_access
                            var resourceAccess = jwt.getClaimAsMap("resource_access");

                            if (resourceAccess != null) {
                                var client = (Map<?, ?>) resourceAccess.get("vendora-app");

                                if (client != null) {
                                    var roles = (List<?>) client.get("roles");

                                    if (roles != null && !roles.isEmpty()) {
                                        role = roles.get(0).toString();
                                    }
                                }
                            }

                            final String finalRole = role;
                            final String finalEmail = email != null ? email : "";
                            final String finalUserId = userId != null ? userId : "";

                            var mutated = exchange.mutate()
                                    .request(r -> r
                                            .header("X-User-Email", finalEmail)
                                            .header("X-User-Role", finalRole)
                                            .header("X-User-Id", finalUserId)
                                    ).build();

                            log.info("Keycloak auth-email: {}, role: {} userId {}", finalEmail, finalRole,finalUserId);

                            return chain.filter(mutated);
                        })
                        .switchIfEmpty(chain.filter(exchange));
    }


    public static class Config{

    }
}
