package com.booking_service.booking_service.service;

import com.booking_service.booking_service.exception.InvalidBookingStatusException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class OtpService {

    private final RedisTemplate<String, String> redisTemplate;

    private static final int OTP_EXPIRATION_MIN = 5;
    private static final int MAX_ATTEMPTS = 3;
    private static final int BLOCK_MIN = 10;

    // FIX 1: Use SecureRandom instead of Random (security-sensitive context)
    private static final SecureRandom secureRandom = new SecureRandom();

    // FIX 2: Added missing colon separator in key strings
    private String otpKey(String id) {
        return "booking:otp:" + id;
    }

    private String attemptKey(String id) {
        return "booking:otp:attempts:" + id;
    }

    private String blockKey(String id) {
        return "booking:otp:block:" + id;
    }

    public String generateOtp(String bookingId) {
        if (Boolean.TRUE.equals(redisTemplate.hasKey(blockKey(bookingId)))) {
            throw new RuntimeException("Blocked. Try again after " + BLOCK_MIN + " minutes.");
        }

        // FIX 3: Correct 6-digit OTP range — was nextInt(9000)+10000 which gives 5 digits (10000–18999)
        String otp = String.valueOf(secureRandom.nextInt(900000) + 100000);

        redisTemplate.opsForValue()
                .set(otpKey(bookingId), otp, Duration.ofMinutes(OTP_EXPIRATION_MIN));

        return otp;
    }

    public void verifyOtp(String bookingId, String inputOtp) {
        if (Boolean.TRUE.equals(redisTemplate.hasKey(blockKey(bookingId)))) {
            throw new RuntimeException("Too many attempts. Try again later.");
        }

        String storedOtp = redisTemplate.opsForValue().get(otpKey(bookingId));

        if (Objects.isNull(storedOtp)) {
            throw new RuntimeException("OTP expired or not found.");
        }

        if (!storedOtp.equals(inputOtp)) {
            Long attempts = redisTemplate.opsForValue().increment(attemptKey(bookingId));
            redisTemplate.expire(attemptKey(bookingId), Duration.ofMinutes(OTP_EXPIRATION_MIN));

            if (attempts != null && attempts >= MAX_ATTEMPTS) {
                redisTemplate.opsForValue().set(blockKey(bookingId), "BLOCKED", Duration.ofMinutes(BLOCK_MIN));
                redisTemplate.delete(attemptKey(bookingId));
                throw new RuntimeException("Max attempts reached. Booking OTP blocked for " + BLOCK_MIN + " minutes.");
            }

            // FIX 4: Was missing `throw` — exception was created but never thrown, silently ignored
            throw new RuntimeException("Invalid OTP (" + attempts + "/" + MAX_ATTEMPTS + " attempts).");
        }

        // OTP matched — clean up both keys
        redisTemplate.delete(otpKey(bookingId));
        // FIX 5: Was passing attemptKey(attemptKey(bookingId)) — double-wrapped key, wrong target
        redisTemplate.delete(attemptKey(bookingId));
    }
}