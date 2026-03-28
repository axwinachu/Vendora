package com.vendora.auth_service.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Component
public class JWTUtil {

    private final String SECRET = "vendora-super-secret-key-for-jwt-authentication-123456";
    private final String Refresh_SECRET="vendore-refresh-secret-for-jwt-refresh-token-789012";
    private SecretKey getKey(){
        return Keys.hmacShaKeyFor(SECRET.getBytes());
    }
    private SecretKey getRefreshKey(){
        return Keys.hmacShaKeyFor(Refresh_SECRET.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(String userId, String email, String role) {

        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        claims.put("role", role);

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(email)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 86400000))
                .signWith(getKey())
                .compact();
    }
   public String generateRefreshToken(String userId,String email){
        Map<String,Object> claims=new HashMap<>();
        claims.put("userId",userId);
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(email)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis()+7*24*60*60*1000L))
                .signWith(getRefreshKey())
                .compact();
   }
   public Claims parseRefreshToken(String token){
        return Jwts.parserBuilder()
                .setSigningKey(getRefreshKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
   }

   public String getEmailFromRefreshToken(String token){
        return parseRefreshToken(token).getSubject();
   }
   public Long getUserIdFromRefreshToken(String token){
        return  parseRefreshToken(token).get("userId", Long.class);
   }
}