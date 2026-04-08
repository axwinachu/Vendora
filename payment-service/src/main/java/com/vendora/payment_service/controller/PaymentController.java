package com.vendora.payment_service.controller;

import com.vendora.payment_service.dto.PaymentResponse;
import com.vendora.payment_service.dto.VerifyOtpRequest;
import com.vendora.payment_service.enums.PaymentStatus;
import com.vendora.payment_service.service.PaymentService;
import com.vendora.payment_service.service.RazorpayService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/payment")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService  paymentService;
    private final RazorpayService razorpayService;

    // ── Provider enters OTP from customer ────────────────────────────
    @PostMapping("/verify-otp")
    public ResponseEntity<PaymentResponse> verifyOtp(
            @Valid @RequestBody VerifyOtpRequest request) {
        PaymentResponse response = paymentService.verifyOtpAndPay(
                request.getBookingId(),
                request.getOtp()
        );
        return ResponseEntity.ok(response);
    }

    // ── Resend OTP to customer if expired ────────────────────────────
    @PostMapping("/resend-otp/{bookingId}")
    public ResponseEntity<Map<String, String>> resendOtp(
            @PathVariable String bookingId) {
        paymentService.resendOtp(bookingId);
        return ResponseEntity.ok(Map.of(
                "message", "OTP resent to customer email"
        ));
    }

    // ── Get payment status by booking ID ─────────────────────────────
    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<PaymentResponse> getByBookingId(
            @PathVariable String bookingId) {
        return ResponseEntity.ok(paymentService.getByBookingId(bookingId));
    }

    // ── Admin: get all payments ───────────────────────────────────────
    @GetMapping("/all")
    public ResponseEntity<List<PaymentResponse>> getAll() {
        return ResponseEntity.ok(paymentService.getAll());
    }

    // ── Razorpay webhook ──────────────────────────────────────────────
    // Razorpay POSTs to this endpoint for payout status changes.
    // Must be publicly accessible (no auth header).
    // Register URL in: Razorpay Dashboard → Settings → Webhooks
    // Events to subscribe: payout.processed, payout.failed, payout.reversed
    @PostMapping("/webhook")
    public ResponseEntity<String> handleWebhook(
            @RequestBody String payload,
            @RequestHeader(value = "X-Razorpay-Signature",
                    required = false) String signature) {

        log.info("Razorpay webhook received");

        // Verify signature — reject if invalid
        if (signature == null || !razorpayService.verifyWebhookSignature(payload, signature)) {
            log.warn("Razorpay webhook rejected — invalid signature");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid signature");
        }

        try {
            JSONObject event     = new JSONObject(payload);
            String     eventType = event.getString("event");
            log.info("Razorpay webhook event: {}", eventType);

            // ── payout.processed — money sent successfully ────────────
            if ("payout.processed".equals(eventType)) {
                JSONObject payoutObj = event
                        .getJSONObject("payload")
                        .getJSONObject("payout")
                        .getJSONObject("entity");

                String payoutId = payoutObj.getString("id");
                log.info("Payout processed: {}", payoutId);
                // Status already set to COMPLETED in our flow — no action needed
            }

            // ── payout.failed — money not sent ───────────────────────
            else if ("payout.failed".equals(eventType)) {
                JSONObject payoutObj = event
                        .getJSONObject("payload")
                        .getJSONObject("payout")
                        .getJSONObject("entity");

                String payoutId  = payoutObj.getString("id");
                String reference = payoutObj.optString("reference_id", "");
                String reason    = payoutObj
                        .optJSONObject("status_details") != null
                        ? payoutObj.getJSONObject("status_details")
                        .optString("reason", "Unknown")
                        : "Unknown";

                log.error("Payout FAILED: {} reason={}", payoutId, reason);

                // If reference_id is our bookingId — mark payment as failed
                if (reference.startsWith("PAY_")) {
                    String bookingId = reference.replace("PAY_", "");
                    paymentService.markPaymentFailed(bookingId, reason);
                }
            }

            // ── payout.reversed — refund to your account ─────────────
            else if ("payout.reversed".equals(eventType)) {
                log.warn("Payout reversed — check Razorpay dashboard");
            }

        } catch (Exception ex) {
            log.error("Error processing Razorpay webhook: {}", ex.getMessage());
            // Still return 200 — so Razorpay doesn't keep retrying
        }

        // Always acknowledge with 200
        return ResponseEntity.ok("OK");
    }
}
