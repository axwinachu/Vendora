package com.vendora.payment_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentEvent {
    private String bookingId;
    private String customerId;
    private String providerId;
    private String customerEmail;
    private String providerEmail;
    private Long   amountPaise;
    private Double amountRupees;
    private String razorpayPayoutId;
    private String eventType;       // "payment.completed" or "payment.failed"
    private String status;
}