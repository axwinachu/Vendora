package com.vendora.payment_service.service;

import com.vendora.payment_service.exception.OtpException;
import lombok.RequiredArgsConstructor;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Objects;
import java.util.Random;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class OtpService {
    private final RedisTemplate<String,String> redisTemplate;
    @Value("${otp.expiry-minutes}")
    private long expiryMinutes;

    private static final String OTP_PREFIX="PAYMENT_OTP:";

    public String generateAndStore(String bookingId){
        String otp=String.format("%06d",new Random().nextInt(999999));
        redisTemplate.opsForValue().set(
                OTP_PREFIX+bookingId,
                otp,
                expiryMinutes,
                TimeUnit.MINUTES
        );
        log.info("OTP generated for booking {}",bookingId);
        return otp;
    }

    public void validate(String bookingId,String otp){
        String stored=redisTemplate.opsForValue().get(OTP_PREFIX+bookingId);

        if(Objects.isNull(stored)){
            throw new OtpException("OTP expired or not found. Please request a new OTP.");
        }
        if (!stored.equals(otp.trim())){
            throw new OtpException("Invalid OTP. Please try again.");
        }
        redisTemplate.delete(OTP_PREFIX+bookingId);
        log.info("OTP validated and consumed for booking {}", bookingId);
    }
    public boolean hasActiveOtp(String bookingId){
        return redisTemplate.hasKey(OTP_PREFIX + bookingId);
    }
}
