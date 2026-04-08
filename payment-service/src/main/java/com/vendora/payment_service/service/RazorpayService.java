package com.vendora.payment_service.service;

import com.vendora.payment_service.exception.PaymentException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;

@Slf4j
@Service
@RequiredArgsConstructor
public class RazorpayService {

    private final RestClient razorpayRestClient;

    @Value("${razorpay.account-number}")
    private String razorpayXAccountNumber;

    @Value("${razorpay.webhook-secret}")
    private String webhookSecret;

    // ── Main entry point called by PaymentService ─────────────────────
    public String initiateProviderPayout(
            String providerAccountNumber,
            String ifsc,
            String providerName,
            Long amountPaise,
            String bookingId) {
        try {
            log.info("Starting payout for booking={} amount=₹{}",
                    bookingId, amountPaise / 100.0);

            // Step 1 — Create Contact
            String contactId = createContact(providerName, bookingId);
            log.info("Contact created: {} for booking {}", contactId, bookingId);

            // Step 2 — Create Fund Account linked to Contact
            String fundAccountId = createFundAccount(
                    contactId, providerAccountNumber, ifsc, providerName);
            log.info("Fund account created: {} for booking {}", fundAccountId, bookingId);

            // Step 3 — Create Payout from your RazorpayX account
            String payoutId = createPayout(fundAccountId, amountPaise, bookingId);
            log.info("Payout created: {} for booking {}", payoutId, bookingId);

            return payoutId;

        } catch (PaymentException ex) {
            throw ex; // rethrow already-wrapped exception
        } catch (Exception ex) {
            log.error("Payout failed for booking {}: {}", bookingId, ex.getMessage());
            throw new PaymentException("Razorpay payout error: " + ex.getMessage());
        }
    }

    // ── Step 1 — Create Contact ───────────────────────────────────────
    private String createContact(String name, String bookingId) {
        JSONObject body = new JSONObject();
        body.put("name",         name);
        body.put("type",         "vendor");
        // reference_id must be unique — prefix with CONT to avoid collision
        body.put("reference_id", "CONT_" + bookingId);
        // Optional but useful for support
        body.put("description",  "Vendora service provider payout");

        String response = post("/contacts", body.toString(), bookingId);
        return new JSONObject(response).getString("id");
    }

    // ── Step 2 — Create Fund Account (bank account of provider) ──────
    private String createFundAccount(String contactId,
                                     String accountNumber,
                                     String ifsc,
                                     String name) {
        JSONObject bankAccount = new JSONObject();
        bankAccount.put("name",           name);
        bankAccount.put("ifsc",           ifsc.toUpperCase().trim());
        bankAccount.put("account_number", accountNumber.trim());

        JSONObject body = new JSONObject();
        body.put("contact_id",    contactId);
        body.put("account_type",  "bank_account");
        body.put("bank_account",  bankAccount);

        // No idempotency key needed for fund accounts
        String response = razorpayRestClient.post()
                .uri("/fund_accounts")
                .body(body.toString())
                .retrieve()
                .onStatus(HttpStatusCode::isError, (req, res) -> {
                    String errorBody = new String(res.getBody().readAllBytes());
                    log.error("Razorpay fund_accounts error: {}", errorBody);
                    throw new PaymentException(
                            "Fund account creation failed: " + parseRazorpayError(errorBody));
                })
                .body(String.class);

        return new JSONObject(response).getString("id");
    }

    // ── Step 3 — Create Payout ────────────────────────────────────────
    private String createPayout(String fundAccountId,
                                Long amountPaise,
                                String bookingId) {
        JSONObject notes = new JSONObject();
        notes.put("booking_id", bookingId);
        notes.put("platform",   "Vendora");

        JSONObject body = new JSONObject();
        body.put("account_number",  razorpayXAccountNumber);
        body.put("fund_account_id", fundAccountId);
        body.put("amount",          amountPaise);        // in paise
        body.put("currency",        "INR");
        body.put("mode",            "IMPS");             // IMPS / NEFT / UPI
        body.put("purpose",         "payout");
        body.put("queue_if_low_balance", true);          // queue instead of failing
        body.put("reference_id",    "PAY_" + bookingId);
        body.put("narration",       "Vendora Payment " + bookingId.substring(0, 8));
        body.put("notes",           notes);

        // X-Payout-Idempotency prevents double payout if request retried
        String response = razorpayRestClient.post()
                .uri("/payouts")
                .header("X-Payout-Idempotency", "PAYOUT_" + bookingId)
                .body(body.toString())
                .retrieve()
                .onStatus(HttpStatusCode::isError, (req, res) -> {
                    String errorBody = new String(res.getBody().readAllBytes());
                    log.error("Razorpay payout error: {}", errorBody);
                    throw new PaymentException(
                            "Payout creation failed: " + parseRazorpayError(errorBody));
                })
                .body(String.class);

        JSONObject json   = new JSONObject(response);
        String     id     = json.getString("id");
        String     status = json.optString("status", "unknown");

        log.info("Payout {} status={} for booking {}", id, status, bookingId);

        // Razorpay test mode returns "processing" — treat as success
        if ("cancelled".equals(status) || "rejected".equals(status)) {
            String reason = json.optString("status_details", "Unknown reason");
            throw new PaymentException("Payout " + status + ": " + reason);
        }

        return id;
    }

    // ── Webhook signature verification ───────────────────────────────
    // Call this in your webhook endpoint to ensure request is from Razorpay
    public boolean verifyWebhookSignature(String payload, String razorpaySignature) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(
                    webhookSecret.getBytes(StandardCharsets.UTF_8),
                    "HmacSHA256"
            ));
            byte[] hash    = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            String computed = HexFormat.of().formatHex(hash);
            boolean valid   = computed.equals(razorpaySignature);
            if (!valid) {
                log.warn("Webhook signature mismatch. Computed={} Received={}",
                        computed, razorpaySignature);
            }
            return valid;
        } catch (Exception ex) {
            log.error("Webhook signature verification error: {}", ex.getMessage());
            return false;
        }
    }

    // ── Get payout status (optional polling) ─────────────────────────
    public String getPayoutStatus(String payoutId) {
        try {
            String response = razorpayRestClient.get()
                    .uri("/payouts/" + payoutId)
                    .retrieve()
                    .body(String.class);
            return new JSONObject(response).optString("status", "unknown");
        } catch (Exception ex) {
            log.error("Failed to get payout status for {}: {}", payoutId, ex.getMessage());
            return "unknown";
        }
    }

    // ── Helper: post with error handling ─────────────────────────────
    private String post(String uri, String body, String ref) {
        try {
            return razorpayRestClient.post()
                    .uri(uri)
                    .body(body)
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, (req, res) -> {
                        String errorBody = new String(res.getBody().readAllBytes());
                        log.error("Razorpay {} error (ref={}): {}", uri, ref, errorBody);
                        throw new PaymentException(
                                "Razorpay API error: " + parseRazorpayError(errorBody));
                    })
                    .body(String.class);
        } catch (RestClientResponseException ex) {
            throw new PaymentException("Razorpay call failed: " + ex.getMessage());
        }
    }

    // ── Helper: extract human-readable error from Razorpay error JSON ─
    private String parseRazorpayError(String errorBody) {
        try {
            JSONObject json  = new JSONObject(errorBody);
            JSONObject error = json.optJSONObject("error");
            if (error != null) {
                return error.optString("description",
                        error.optString("code", errorBody));
            }
        } catch (Exception ignored) {}
        return errorBody;
    }
}