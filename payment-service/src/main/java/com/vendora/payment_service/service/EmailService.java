package com.vendora.payment_service.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    // OTP email to customer
    @Async
    public void sendPaymentOtp(String customerEmail, String otp,
                               String providerName, String bookingId,
                               long expiryMinutes) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setTo(customerEmail);
            msg.setSubject("Vendora — Payment Verification OTP");
            msg.setText(
                    "Hello,\n\n" +
                            "Your service from " + providerName + " has been completed.\n\n" +
                            "Please share this OTP with the provider to confirm payment:\n\n" +
                            "    OTP: " + otp + "\n\n" +
                            "This OTP is valid for " + expiryMinutes + " minutes.\n" +
                            "Booking ID: " + bookingId + "\n\n" +
                            "Do NOT share this OTP with anyone other than your service provider.\n\n" +
                            "Team Vendora"
            );
            mailSender.send(msg);
            log.info("Payment OTP sent to {}", customerEmail);
        } catch (Exception ex) {
            log.error("Failed to send OTP email to {}: {}", customerEmail, ex.getMessage());
        }
    }

    // Receipt to customer after payment
    @Async
    public void sendCustomerReceipt(String customerEmail, String providerName,
                                    double amountRupees, String bookingId) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setTo(customerEmail);
            msg.setSubject("Vendora — Payment Receipt ₹" + amountRupees);
            msg.setText(
                    "Payment confirmed!\n\n" +
                            "Provider: " + providerName + "\n" +
                            "Amount: ₹" + amountRupees + "\n" +
                            "Booking ID: " + bookingId + "\n\n" +
                            "Thank you for using Vendora!\n\n" +
                            "Team Vendora"
            );
            mailSender.send(msg);
            log.info("Receipt sent to customer {}", customerEmail);
        } catch (Exception ex) {
            log.error("Failed to send receipt to {}: {}", customerEmail, ex.getMessage());
        }
    }

    // Payout confirmation to provider
    @Async
    public void sendProviderPayoutConfirmation(String providerEmail,
                                               String providerName,
                                               double amountRupees,
                                               String payoutId,
                                               String bookingId) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setTo(providerEmail);
            msg.setSubject("Vendora — Payout of ₹" + amountRupees + " initiated");
            msg.setText(
                    "Hi " + providerName + ",\n\n" +
                            "Your payout has been initiated!\n\n" +
                            "Amount: ₹" + amountRupees + "\n" +
                            "Payout ID: " + payoutId + "\n" +
                            "Booking ID: " + bookingId + "\n\n" +
                            "The amount will be credited to your bank account within 2 business days.\n\n" +
                            "Team Vendora"
            );
            mailSender.send(msg);
            log.info("Payout confirmation sent to provider {}", providerEmail);
        } catch (Exception ex) {
            log.error("Failed to send payout email to {}: {}", providerEmail, ex.getMessage());
        }
    }
}