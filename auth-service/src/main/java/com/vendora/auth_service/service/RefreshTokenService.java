package com.vendora.auth_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Objects;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {
    private final RedisTemplate<String,String> redisTemplate;

    private static final String PREFIX="REFRESH";
    private static final long TTL_DAY= 7;


    public void storeRefreshToken(String userId,String refreshToken){
        redisTemplate.opsForValue().set(PREFIX+userId,refreshToken,TTL_DAY, TimeUnit.DAYS);
    }

    public boolean validateRefreshToken(Long userId,String refreshToken){
        String stored=redisTemplate.opsForValue().get(PREFIX+userId);
        if(Objects.isNull(stored)){
            throw  new RuntimeException("RefreshToken expired or not found pleas login ");
        }
        return stored.equals(refreshToken);
    }

    public void deleteRefreshToken(Long userId){
        redisTemplate.delete(PREFIX+userId);
    }
}
