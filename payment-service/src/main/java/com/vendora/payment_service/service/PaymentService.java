package com.vendora.payment_service.service;

import com.vendora.payment_service.enums.PaymentStatus;
import com.vendora.payment_service.exception.PaymentException;
import com.vendora.payment_service.model.Payment;
import com.vendora.payment_service.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PaymentService {
    private final PaymentRepository paymentRepository;
    public Optional<Payment> findByBookingIdAndStatus(String bookingId, PaymentStatus status){
        return paymentRepository.findByBookingIdAndStatus(bookingId,status);
    }

    public Payment save(Payment payment){
        return paymentRepository.save(payment);
    }
    public Payment findByPaymentIntentId(String paymentIntentId){
        return paymentRepository.findByPaymentIntentId(paymentIntentId)
                .orElseThrow(()->new PaymentException("payment not found"));
    }
}
