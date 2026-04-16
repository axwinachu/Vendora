package com.vendora.payment_service.service;

import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import com.vendora.payment_service.dto.BookingResponse;
import com.vendora.payment_service.dto.CreatePaymentRequest;
import com.vendora.payment_service.dto.PaymentResponse;
import com.vendora.payment_service.enums.PaymentStatus;
import com.vendora.payment_service.exception.PaymentException;
import com.vendora.payment_service.feign.BookingClient;
import com.vendora.payment_service.model.Payment;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class StripeService {

    private final PaymentService paymentService;
    private final BookingClient bookingClient;

    public PaymentResponse createPayment(CreatePaymentRequest request){
        BookingResponse booking=bookingClient.getBooking(request.getBookingId());

        if("".equals(booking.getStatus())) {
            throw new PaymentException("Payment allowed only after confirmed");
        }
        paymentService.findByBookingIdAndStatus(request.getBookingId(), PaymentStatus.SUCCESS)
                .ifPresent(p->{
                    throw new RuntimeException("Already paid");
                });
        try {
            Double amount=booking.getBasePrice();
            if(amount==null){
                amount=100.0;
            }
            PaymentIntent intent = PaymentIntent.create(
                    PaymentIntentCreateParams.builder()
                            .setAmount((long)(amount * 100))
                            .setCurrency("inr")
                            .setAutomaticPaymentMethods(
                                    PaymentIntentCreateParams.AutomaticPaymentMethods.builder()
                                            .setEnabled(true)
                                            .build()
                            )
                            .build()
            );

            Payment payment=Payment.builder()
                    .paymentIntentId(intent.getId())
                    .clientSecret(intent.getClientSecret())
                    .amount(amount)
                    .currency("INR")
                    .status(PaymentStatus.CREATED)
                    .bookingId(request.getBookingId())
                    .build();
            paymentService.save(payment);
            return PaymentResponse.builder()
                    .paymentId(payment.getId())
                    .paymentIntentId(intent.getId())
                    .clientSecret(intent.getClientSecret())
                    .bookingId(payment.getBookingId())
                    .amount(amount)
                    .currency("INR")
                    .status("CREATED")
                    .message("Payment initiated")
                    .build();
        }catch (Exception ex){
            ex.printStackTrace();
            throw new PaymentException("Stripe error");

        }
    }
    public PaymentResponse confirmPayment(String paymentIntentId){
        try{
            PaymentIntent intent =PaymentIntent.retrieve(paymentIntentId);
            Payment payment=paymentService.findByPaymentIntentId(paymentIntentId);
            if("succeeded".equals(intent.getStatus())){
                payment.setStatus(PaymentStatus.SUCCESS);
                paymentService.save(payment);;

                bookingClient.markPaid(payment.getBookingId());
                return PaymentResponse.builder()
                        .paymentId(payment.getId())
                        .paymentIntentId(paymentIntentId)
                        .bookingId(payment.getBookingId())
                        .amount(payment.getAmount())
                        .currency(payment.getCurrency())
                        .status("SUCCESS")
                        .message("Payment successful")
                        .build();
            }
            payment.setStatus(PaymentStatus.FAILED);
            paymentService.save(payment);

            return PaymentResponse.builder()
                    .status("FAILED")
                    .message("Payment failed")
                    .build();
        }catch (Exception ex){
            ex.printStackTrace();
            throw new PaymentException("Verification failed"+ex.getMessage());
        }
    }
}
