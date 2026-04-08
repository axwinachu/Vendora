package com.vendora.payment_service.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.vendora.payment_service.enums.PaymentStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class PaymentResponse {
    private String id;
    private String bookingId;
    private String customerId;
    private String providerId;
    private Long   amountPaise;
    private Double amountRupees;
    private PaymentStatus status;
    private String razorpayPayoutId;
    private String failureReason;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime updatedAt;
}