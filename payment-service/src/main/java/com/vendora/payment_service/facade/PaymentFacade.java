package com.vendora.payment_service.facade;

import com.vendora.payment_service.dto.CreatePaymentRequest;
import com.vendora.payment_service.dto.PaymentResponse;
import com.vendora.payment_service.service.StripeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class PaymentFacade {

    private final StripeService service;

    public PaymentResponse createPayment(CreatePaymentRequest request) {
        return service.createPayment(request);
    }

    public PaymentResponse confirmPayment(String paymentIntentId) {
        return service.confirmPayment(paymentIntentId);
    }
}