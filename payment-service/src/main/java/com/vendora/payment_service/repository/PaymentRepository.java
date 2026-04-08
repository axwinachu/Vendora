package com.vendora.payment_service.repository;

import com.vendora.payment_service.enums.PaymentStatus;
import com.vendora.payment_service.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment,String> {
    Optional<Payment> findByBookingId(String bookingId);

    List<Payment> findByProviderId(String providerId);

    List<Payment> findByCustomerId(String customerId);

    List<Payment> findByStatus(PaymentStatus status);

    boolean existsByBookingId(String bookingId);
}
