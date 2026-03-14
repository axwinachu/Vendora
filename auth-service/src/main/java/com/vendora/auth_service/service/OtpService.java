package com.vendora.auth_service.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vendora.auth_service.dto.PendingUser;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Objects;
import java.util.Random;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class OtpService {
    private final RedisTemplate<String,String> redisTemplate;
    private final ObjectMapper objectMapper;
    private static final long OTP_TTL_MINUTES = 5;
    public String generateOtp(){
        Random random=new Random();

        int otp = 100000 + random.nextInt(900000);

        return String.valueOf(otp);
    }
    public void storeOtp(String email,String otp){
        redisTemplate.opsForValue()
                .set("OTP:"+email,otp,5, TimeUnit.MINUTES);
    }
    public void storePendingUser(PendingUser pendingUser){
        try {
            String json= objectMapper.writeValueAsString(pendingUser);
            redisTemplate.opsForValue().set("PENDING:"+pendingUser.getEmail(),json,OTP_TTL_MINUTES,TimeUnit.MINUTES);
        }catch (Exception ex){
            throw new RuntimeException("failed store pending user");
        }
    }
    public PendingUser getPendingUser(String email){
        String json=redisTemplate.opsForValue().get("PENDING:"+ email);
        if(Objects.isNull(json)){
            throw new RuntimeException("Registration session expired please.Please signup again");
        }
        try {
            return objectMapper.readValue(json, PendingUser.class);
        }catch (Exception ex){
            throw new RuntimeException("Failed to read pending user data");
        }
    }
    public boolean validateOtp(String email,String otp){

        String storedOtp = redisTemplate.opsForValue()
                .get("OTP:"+email);

        if(Objects.isNull(storedOtp)){
            System.out.println(storedOtp);
            throw new RuntimeException("OTP expired");
        }

        return storedOtp.equals(otp);
    }

    public void deleteOtp(String email){
        redisTemplate.delete("OTP:"+email);
    }
    public void deletePendingUser(String email){
        redisTemplate.opsForValue().decrement("PENDING"+email);
    }
}
