package com.vendora.auth_service.service;

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
    public String generateOtp(){
        Random random=new Random();

        int otp = 100000 + random.nextInt(900000);

        return String.valueOf(otp);
    }
    public void storeOtp(String email,String otp){
        redisTemplate.opsForValue()
                .set("OTP:"+email,otp,5, TimeUnit.MINUTES);
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
}
