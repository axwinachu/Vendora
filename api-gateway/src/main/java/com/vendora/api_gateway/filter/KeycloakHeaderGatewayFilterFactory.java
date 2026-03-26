package com.vendora.api_gateway.filter;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class KeycloakHeaderFilterFactory extends AbstractGatewayFilterFactory<KeycloakHeaderFilterFactory.Config> {
    public KeycloakHeaderFilterFactory(){
        super(Config.class);
    }

    @Override
    public GatewayFilter apply(Config config) {
        return ((exchange, chain) ->
                ReactiveSecurityContextHolder.getContext()
                        .map(ctx->ctx.getAuthentication())
                        .cast(JwtAuthenticationToken.class).flatMap(auth->{
                            Jwt jwt=auth.getToken();
                            String email=jwt.getClaimAsString("email");
                            String userId=jwt.getSubject();

                            String role="CUSTOMER";

                            var realmAccess =jwt.getClaimAsMap("realm_access");
                            if (realmAccess!=null){
                                var roles=(java.util.List<?>) realmAccess.get("roles");
                                if (roles!=null){
                                    if(roles.contains("ADMIN")) role="ADMIN";
                                    else if (roles.contains("PROVIDER")) role="PROVIDER";
                                    else if (roles.contains("CUSTOMER")) role="CUSTOMER";
                                }
                            }
                            final String finalRole=role;
                            final String finalEmail=email!=null?email:"";
                            final String finalUserId=userId!=null?userId:"";

                            var mutated=exchange.mutate()
                                    .request(r->r
                                            .header("X-User-Email",finalEmail)
                                            .header("X-User-Role",finalRole)
                                            .header("X-User-Id",finalUserId)
                                    ).build();

                            log.info("Keycloak auth-email:{},role;{}",finalEmail,finalRole);
                            return chain.filter(mutated);
                        }));
    }

    public static class Config{

    }
}
