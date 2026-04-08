package com.vendora.payment_service.model;

import com.vendora.payment_service.enums.PaymentStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36)
    private String id;

    @Column(unique = true,nullable = false,length = 36)
    private String bookingId;

    @Column(nullable = false,length = 36)
    private String customerId;

    @Column(nullable = false,length = 36)
    private String providerId;

    @Column(nullable = false,length = 100)
    private String customerEmail;

    @Column(nullable = false,length = 100)
    private String providerEmail;

    @Column(nullable = false)
    private  Long amountPaise;

    @Column(nullable = false,length = 20)
    @Builder.Default
    @Enumerated(EnumType.STRING)
    private PaymentStatus status=PaymentStatus.OTP_PENDING;

    @Column(length = 50)
    private String providerAccountNumber;


    @Column(name = "provider_ifsc", length = 20)
    private String providerIfsc;

    @Column(name = "provider_name", length = 100)
    private String providerName;

    @Column(name = "failure_reason", length = 500)
    private String failureReason;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    private String razorpayPayoutId;
}
