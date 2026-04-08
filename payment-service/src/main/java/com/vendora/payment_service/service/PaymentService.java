package com.vendora.payment_service.service;

import com.vendora.payment_service.dto.*;
import com.vendora.payment_service.enums.PaymentStatus;
import com.vendora.payment_service.exception.OtpException;
import com.vendora.payment_service.exception.PaymentException;
import com.vendora.payment_service.exception.PaymentNotFoundException;
import com.vendora.payment_service.client.BookingServiceClient;
import com.vendora.payment_service.client.ProviderServiceClient;
import com.vendora.payment_service.client.UserServiceClient;
import com.vendora.payment_service.model.Payment;
import com.vendora.payment_service.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository     paymentRepository;
    private final OtpService            otpService;
    private final EmailService          emailService;
    private final RazorpayService       razorpayService;
    private final UserServiceClient     userServiceClient;
    private final ProviderServiceClient providerServiceClient;
    private final BookingServiceClient  bookingServiceClient;
    private final KafkaTemplate<String, PaymentEvent> kafkaTemplate;

    // ── Called by Kafka consumer when booking.completed fires ────────
    @Transactional
    public void handleBookingCompleted(BookingCompletedEvent event) {
        log.info("handleBookingCompleted bookingId={}", event.getBookingId());

        // Prevent duplicate processing
        if (paymentRepository.existsByBookingId(event.getBookingId())) {
            log.warn("Payment already exists for booking {} — skipping",
                    event.getBookingId());
            return;
        }

        // Fetch customer and provider details via Feign
        UserResponse     customer = userServiceClient
                .getUserById(event.getCustomerId());
        ProviderResponse provider = providerServiceClient
                .getProviderById(event.getProviderId());

        // Razorpay works in paise — ₹299 = 29900 paise
        long amountPaise = event.getBasePrice() != null
                ? Math.round(event.getBasePrice() * 100)
                : 0L;

        // Create Payment record in PENDING state
        Payment payment = Payment.builder()
                .bookingId(event.getBookingId())
                .customerId(event.getCustomerId())
                .providerId(event.getProviderId())
                .customerEmail(customer.getEmail())
                .providerEmail(provider.getBusinessName())
                .amountPaise(amountPaise)
                .providerAccountNumber(provider.getAccountNumber())
                .providerIfsc(provider.getIfscCode())
                .providerName(provider.getBusinessName())
                .status(PaymentStatus.OTP_PENDING)
                .build();

        paymentRepository.save(payment);

        // Generate 6-digit OTP valid for 10 minutes
        String otp = otpService.generateAndStore(event.getBookingId());

        // Send OTP to customer email
        emailService.sendPaymentOtp(
                customer.getEmail(),
                otp,
                provider.getBusinessName(),
                event.getBookingId(),
                10
        );

        log.info("Payment record created and OTP sent to {} for booking {}",
                customer.getEmail(), event.getBookingId());
    }

    // ── Provider submits OTP they got from customer ──────────────────
    @Transactional
    public PaymentResponse verifyOtpAndPay(String bookingId, String otp) {

        Payment payment = paymentRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new PaymentNotFoundException(
                        "No payment found for booking: " + bookingId));

        if (payment.getStatus() != PaymentStatus.OTP_PENDING) {
            throw new PaymentException(
                    "Payment cannot be processed. Current status: "
                            + payment.getStatus());
        }

        // Throws OtpException if invalid or expired
        otpService.validate(bookingId, otp);

        // OTP correct
        payment.setStatus(PaymentStatus.OTP_VERIFIED);
        paymentRepository.save(payment);
        log.info("OTP verified for booking {}", bookingId);

        // Initiate Razorpay payout
        return initiatePayoutInternal(payment);
    }

    // ── Internal: trigger Razorpay payout ────────────────────────────
    @Transactional
    public PaymentResponse initiatePayoutInternal(Payment payment) {
        payment.setStatus(PaymentStatus.PAYOUT_PENDING);
        paymentRepository.save(payment);

        try {
            String payoutId = razorpayService.initiateProviderPayout(
                    payment.getProviderAccountNumber(),
                    payment.getProviderIfsc(),
                    payment.getProviderName(),
                    payment.getAmountPaise(),
                    payment.getBookingId()
            );

            // Mark payment COMPLETED
            payment.setRazorpayPayoutId(payoutId);
            payment.setStatus(PaymentStatus.COMPLETED);
            paymentRepository.save(payment);

            // Tell booking-service to mark booking PAID
            try {
                bookingServiceClient.markPaid(payment.getBookingId(), "ADMIN");
                log.info("Booking {} marked PAID", payment.getBookingId());
            } catch (Exception ex) {
                // Don't fail payment if this call fails
                log.error("Failed to mark booking PAID: {}", ex.getMessage());
            }

            // Publish payment.completed Kafka event
            publishEvent(payment, "payment.completed");

            // Send confirmation emails
            emailService.sendCustomerReceipt(
                    payment.getCustomerEmail(),
                    payment.getProviderName(),
                    payment.getAmountPaise() / 100.0,
                    payment.getBookingId()
            );
            emailService.sendProviderPayoutConfirmation(
                    payment.getProviderEmail(),
                    payment.getProviderName(),
                    payment.getAmountPaise() / 100.0,
                    payoutId,
                    payment.getBookingId()
            );

            log.info("Payment COMPLETED for booking {}, payout={}",
                    payment.getBookingId(), payoutId);
            return toResponse(payment);

        } catch (Exception ex) {
            // Mark as FAILED — don't retry automatically
            payment.setStatus(PaymentStatus.FAILED);
            payment.setFailureReason(ex.getMessage());
            paymentRepository.save(payment);

            publishEvent(payment, "payment.failed");
            log.error("Payout FAILED for booking {}: {}",
                    payment.getBookingId(), ex.getMessage());

            throw new PaymentException("Payout failed: " + ex.getMessage());
        }
    }

    // ── Called by webhook controller when Razorpay sends payout.failed
    @Transactional
    public void markPaymentFailed(String bookingId, String reason) {
        paymentRepository.findByBookingId(bookingId).ifPresent(payment -> {
            payment.setStatus(PaymentStatus.FAILED);
            payment.setFailureReason(reason);
            paymentRepository.save(payment);
            publishEvent(payment, "payment.failed");
            log.warn("Payment marked FAILED via webhook for booking {}: {}",
                    bookingId, reason);
        });
    }

    // ── Resend OTP (if customer's OTP expired) ────────────────────────
    @Transactional
    public void resendOtp(String bookingId) {
        Payment payment = paymentRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new PaymentNotFoundException(
                        "No payment found for booking: " + bookingId));

        if (payment.getStatus() != PaymentStatus.OTP_PENDING) {
            throw new PaymentException(
                    "Cannot resend OTP — payment status: " + payment.getStatus());
        }

        String otp = otpService.generateAndStore(bookingId);
        emailService.sendPaymentOtp(
                payment.getCustomerEmail(),
                otp,
                payment.getProviderName(),
                bookingId,
                10
        );
        log.info("OTP resent for booking {}", bookingId);
    }

    // ── Get single payment ────────────────────────────────────────────
    public PaymentResponse getByBookingId(String bookingId) {
        return toResponse(
                paymentRepository.findByBookingId(bookingId)
                        .orElseThrow(() -> new PaymentNotFoundException(
                                "No payment found for booking: " + bookingId))
        );
    }

    // ── Admin: get all payments ───────────────────────────────────────
    public List<PaymentResponse> getAll() {
        return paymentRepository.findAll()
                .stream().map(this::toResponse).toList();
    }

    // ── Helpers ───────────────────────────────────────────────────────
    private void publishEvent(Payment payment, String eventType) {
        try {
            PaymentEvent event = PaymentEvent.builder()
                    .bookingId(payment.getBookingId())
                    .customerId(payment.getCustomerId())
                    .providerId(payment.getProviderId())
                    .customerEmail(payment.getCustomerEmail())
                    .providerEmail(payment.getProviderEmail())
                    .amountPaise(payment.getAmountPaise())
                    .amountRupees(payment.getAmountPaise() / 100.0)
                    .razorpayPayoutId(payment.getRazorpayPayoutId())
                    .eventType(eventType)
                    .status(payment.getStatus().name())
                    .build();
            kafkaTemplate.send(eventType, payment.getBookingId(), event);
            log.info("Published Kafka event: {} for booking {}",
                    eventType, payment.getBookingId());
        } catch (Exception ex) {
            log.error("Failed to publish Kafka event {}: {}", eventType, ex.getMessage());
        }
    }

    private PaymentResponse toResponse(Payment p) {
        return PaymentResponse.builder()
                .id(p.getId())
                .bookingId(p.getBookingId())
                .customerId(p.getCustomerId())
                .providerId(p.getProviderId())
                .amountPaise(p.getAmountPaise())
                .amountRupees(p.getAmountPaise() != null ? p.getAmountPaise() / 100.0 : 0)
                .status(p.getStatus())
                .razorpayPayoutId(p.getRazorpayPayoutId())
                .failureReason(p.getFailureReason())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}