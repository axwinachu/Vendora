package com.vendora.payment_service.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class PaymentResponse {

    private String paymentId;           // internal DB id
    private String paymentIntentId;     // Stripe ID
    private String clientSecret;        // used by frontend

    private String bookingId;
    private Double amount;
    private String currency;

    private String status;              // CREATED / SUCCESS / FAILED
    private String message;

    private LocalDateTime timestamp;
}