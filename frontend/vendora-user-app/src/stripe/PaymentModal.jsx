import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import axios from "../api/axios";

/* ─── Load Stripe once (outside component to avoid re-init) ── */
const stripePromise = loadStripe("pk_test_51TKAM33UG9hGjDgIBU7mzifMqaE4xCudnNwRAXZoztBCd2FNrX6vvmB52z64c5RxQHIaWON1Q7cVGLRYKhFqu6G900YBLQixP3");

/* ─── Inner checkout form — must live inside <Elements> ──────── */
const CheckoutForm = ({ paymentIntentId, amount, currency, onSuccess, onClose }) => {
  const stripe   = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [err, setErr]       = useState("");

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setPaying(true);
    setErr("");

    // Step 1 — confirm the payment with Stripe (card details entered in PaymentElement)
    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      redirect: "if_required", // stay on page — no redirect needed for cards
    });

    if (stripeError) {
      // Stripe validation / card error — show to user
      setErr(stripeError.message);
      setPaying(false);
      return;
    }

    // Step 2 — tell your backend to verify the intent and mark booking as PAID
    try {
      await axios.get(`/payments/confirm/${paymentIntentId}`);
      onSuccess(); // triggers fetchBookings() in parent
    } catch (backendErr) {
      // Payment went through on Stripe side but backend verification failed
      setErr(
        backendErr?.response?.data?.message ||
        "Payment was processed but confirmation failed. Please contact support."
      );
      setPaying(false);
    }
  };

  return (
    <div className="bk-modal bk-modal--sm" onClick={e => e.stopPropagation()}>

      {/* Header */}
      <div className="bk-modal__header">
        <div>
          <div className="bk-modal__eyebrow">Secure Payment</div>
          <h2 className="bk-modal__title">Complete Your Payment</h2>
        </div>
        <button className="bk-modal__close" onClick={onClose} disabled={paying}>✕</button>
      </div>

      {/* Body */}
      <div className="bk-modal__body">

        {/* Amount display */}
        {amount && (
          <div className="bk-payment-amount">
            <span className="bk-payment-amount__label">Amount to pay</span>
            <span className="bk-payment-amount__val">
              {currency === "INR" ? "₹" : "$"}{amount}
            </span>
          </div>
        )}

        {/* Stripe's hosted card input — handles card number, expiry, CVC */}
        <div className="bk-payment-element-wrap">
          <PaymentElement
            options={{
              layout: "tabs",
              paymentMethodOrder: ["card", "upi"],
            }}
          />
        </div>

        {/* Error message */}
        {err && (
          <div className="bk-payment-error">
            <span>⚠️</span>
            <span>{err}</span>
          </div>
        )}

        {/* Security note */}
        <p className="bk-payment-secure-note">
          🔒 Your payment is encrypted and secured by Stripe.
        </p>
      </div>

      {/* Footer */}
      <div className="bk-modal__footer">
        <button
          className="bk-btn bk-btn--ghost"
          onClick={onClose}
          disabled={paying}
        >
          Cancel
        </button>
        <button
          className={`bk-btn bk-btn--primary ${paying ? "bk-btn--loading" : ""}`}
          onClick={handlePay}
          disabled={paying || !stripe || !elements}
        >
          {paying
            ? <><div className="bk-spinner" /> Processing…</>
            : `💳 Pay ${amount ? `₹${amount}` : "Now"}`}
        </button>
      </div>
    </div>
  );
};

/* ─── Outer wrapper — provides Stripe context via <Elements> ─── */
const PaymentModal = ({ clientSecret, paymentIntentId, amount, currency, onSuccess, onClose }) => {

  // Stripe Elements appearance — matches your app's dark/light theme
  const appearance = {
    theme: "stripe",
    variables: {
      colorPrimary:       "#6366f1",
      colorBackground:    "#ffffff",
      colorText:          "#1e1e2e",
      colorDanger:        "#ef4444",
      fontFamily:         "inherit",
      borderRadius:       "8px",
    },
  };

  return (
    <div className="bk-modal-overlay" onClick={onClose}>
      <Elements
        stripe={stripePromise}
        options={{ clientSecret, appearance }}
      >
        <CheckoutForm
          paymentIntentId={paymentIntentId}
          amount={amount}
          currency={currency}
          onSuccess={onSuccess}
          onClose={onClose}
        />
      </Elements>
    </div>
  );
};

export default PaymentModal;