package com.vendora.auth_service.service;

import lombok.RequiredArgsConstructor;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;


@Service
@RequiredArgsConstructor
public class EmailService {
    private final JavaMailSender mailSender;

    public void sendOtp(String email,String otp){
        SimpleMailMessage message=new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("Vendora OTP Verification");

        message.setText("Your OTP is: "+otp);

        mailSender.send(message);
    }

}
