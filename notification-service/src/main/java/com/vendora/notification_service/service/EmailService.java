package com.vendora.notification_service.service;

import lombok.RequiredArgsConstructor;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {
    private final JavaMailSender mailSender;

    @Value("${notification.from-email}")
    private String fromEmail;

    @Value("${notification.from-name}")
    private String fromName;

    public void send(String to,String subject,String body){
        try {
            SimpleMailMessage message=new SimpleMailMessage();
            message.setFrom(fromName+"<" +fromEmail +">");
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("Email sent-> to ={} subject= {}",to,subject);

        }catch (Exception ex){
            log.error("failed to send email to ={} reason= {} ",to,ex.getMessage());
        }
    }

    public void sendOtp(String to,String otp){
        try{
            String subject= "Booking Completion OTP";

            String body = """
            Hello,

            Your OTP for booking completion is: %s

            This OTP is valid for 5 minutes.
            Do not share it with anyone.

            Thank you,
            Vendora Team
            """.formatted(otp);


            send(to,subject,body);

        }catch (Exception ex){
            log.info("failed to send otp email -> {} ",ex.getMessage());
        }
    }

}
