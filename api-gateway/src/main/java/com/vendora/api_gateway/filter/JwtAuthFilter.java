package com.vendora.api_gateway.filter;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Objects;

@Component
@Slf4j
public class JwtAuthFilter extends AbstractGatewayFilterFactory<JwtAuthFilter.Config> {

    @Value("{jwt.secret}")
    private String secret;

    public JwtAuthFilter(){
        super(Config.class);
    }
    @Override
    public GatewayFilter apply(Config config) {
    return ((exchange, chain) -> {
        String authHeader=exchange.getRequest()
                .getHeaders().getFirst(HttpHeaders.AUTHORIZATION);

        if (Objects.isNull(authHeader) || !authHeader.startsWith("Bearer")){
            log.warn("Missing or invalid Authorization header");
            return unAuthorized(exchange);
        }
        String token=authHeader.substring(7);
        try{
            Claims claims=parseToken(token);
            String email=claims.getSubject();
            String role=claims.get("role",String.class);
            String userId=claims.get("userId",String.class);
            ServerWebExchange mutatedExchange=exchange.mutate()
                    .request(r->r
                            .header("X-User-Email",email)
                            .header("X-User-Role",role)
                            .header("X-User-Id",userId)
                    ).build();
            log.info("JWT valid — email: {}, role: {}", email, role);
            return chain.filter(mutatedExchange);
        }catch (Exception ex){
            log.error("JWT validation failed: {}", ex.getMessage());
            return unAuthorized(exchange);
        }
    });
    }
    private Claims parseToken(String token){
        SecretKey key= Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private Mono<Void> unAuthorized(ServerWebExchange exchange){
        exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
        return exchange.getResponse().setComplete();
    }

    public static class Config{

    }
}
