package com.vendora.payment_service.controller;

import com.vendora.payment_service.dto.CreatePaymentRequest;
import com.vendora.payment_service.dto.PaymentResponse;
import com.vendora.payment_service.facade.PaymentFacade;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentFacade facade;


    @PostMapping("/create")
    public ResponseEntity<PaymentResponse> createPayment(
            @RequestBody CreatePaymentRequest request) {

        return ResponseEntity.ok(facade.createPayment(request));
    }

    @GetMapping("/confirm/{paymentIntentId}")
    public ResponseEntity<PaymentResponse> confirmPayment(
            @PathVariable String paymentIntentId) {

        return ResponseEntity.ok(facade.confirmPayment(paymentIntentId));
    }
}