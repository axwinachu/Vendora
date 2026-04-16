package com.vendora.payment_service.repository;

import com.vendora.payment_service.enums.PaymentStatus;
import com.vendora.payment_service.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment,String> {
    Optional<Payment> findByPaymentIntentId(String paymentIntentId);

    Optional<Payment> findByBookingIdAndStatus(String bookingId, PaymentStatus status);
}
