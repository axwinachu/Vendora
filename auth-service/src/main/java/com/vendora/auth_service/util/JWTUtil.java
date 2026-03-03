package com.vendora.auth_service.util;

import com.vendora.auth_service.enums.Role;
import io.jsonwebtoken.Jwts;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
public class JWTUtil {
    @Value("${secret.key}")
    private String secret;
    public String generateToken(Long userId, String email, Role role){
        Map<String,Object> claims=new HashMap<>();
        claims.put("userId",userId);
        claims.put("email",email);
        claims.put("role",role);

        return Jwts.builder()
    }
}
