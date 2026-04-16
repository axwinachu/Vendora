import React, { useState, useEffect } from "react";
import axios from "../api/axios";

function getTodayStr() {
  return new Date().toISOString().split("T")[0];
}

export default function BookingModal({ provider, onClose, onSuccess }) {
  const [form, setForm] = useState({
    serviceCategory: provider?.serviceCategory || "",
    scheduledDate:   "",
    scheduledTime:   "",
    address:         "",
    notes:           "",
  });
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [step,     setStep]     = useState(1); // 1 = form, 2 = success

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const providerId = provider?.userId || provider?.id;

  function onChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError(null);
  }

  function validate() {
    if (!form.scheduledDate)   return "Please pick a scheduled date.";
    if (form.scheduledDate <= getTodayStr()) return "Date must be in the future.";
    if (!form.scheduledTime)   return "Please pick a scheduled time.";
    if (!form.address.trim())  return "Address is required.";
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        providerId,
        serviceCategory: form.serviceCategory,
        scheduledDate:   form.scheduledDate,          
        scheduledTime:   form.scheduledTime + ":00",  
        address:         form.address.trim(),
        notes:           form.notes.trim() || null,
      };
      console.log("FULL Provider Object:", provider);
      console.log("Sending userId:", provider?.userId);
      const res = await axios.post("/booking/create", payload);
      setStep(2);
      onSuccess?.(res.data);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        "Booking failed. Please try again.";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div className="bm-backdrop" onClick={onClose} />

      {/* Modal */}
      <div className="bm-modal" role="dialog" aria-modal="true"
           aria-label="Book a service">

        {/* ── Header ── */}
        <div className="bm-header">
          <div className="bm-header__info">
            <p className="bm-header__eyebrow">Book a Service</p>
            <h2 className="bm-header__title">
              {provider?.businessName || "Service Provider"}
            </h2>
            {provider?.district && (
              <p className="bm-header__loc">📍 {provider.district}</p>
            )}
          </div>
          <button className="bm-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* ─────────────────────────────────────────────────── */}
        {step === 1 && (
          <form className="bm-form" onSubmit={handleSubmit} noValidate>

            {/* Error banner */}
            {error && (
              <div className="bm-error">
                <span>⚠️</span> {error}
              </div>
            )}

            {/* Service Category — locked to the provider's category */}
            <div className="bm-field">
              <label className="bm-label">Service Category</label>
              <div className="bm-input bm-input--readonly">
                {(form.serviceCategory || "N/A").replace(/_/g, " ")}
              </div>
            </div>

            {/* Date + Time — side by side */}
            <div className="bm-row">
              <div className="bm-field">
                <label className="bm-label" htmlFor="bm-date">
                  Date <span className="bm-req">*</span>
                </label>
                <input
                  id="bm-date"
                  type="date"
                  name="scheduledDate"
                  className="bm-input"
                  min={getTodayStr()}
                  value={form.scheduledDate}
                  onChange={onChange}
                  required
                />
              </div>
              <div className="bm-field">
                <label className="bm-label" htmlFor="bm-time">
                  Time <span className="bm-req">*</span>
                </label>
                <input
                  id="bm-time"
                  type="time"
                  name="scheduledTime"
                  className="bm-input"
                  value={form.scheduledTime}
                  onChange={onChange}
                  required
                />
              </div>
            </div>

            {/* Address */}
            <div className="bm-field">
              <label className="bm-label" htmlFor="bm-address">
                Service Address <span className="bm-req">*</span>
              </label>
              <input
                id="bm-address"
                type="text"
                name="address"
                className="bm-input"
                placeholder="Full address where service is needed"
                value={form.address}
                onChange={onChange}
                required
              />
            </div>

            {/* Notes */}
            <div className="bm-field">
              <label className="bm-label" htmlFor="bm-notes">
                Notes <span className="bm-opt">(optional)</span>
              </label>
              <textarea
                id="bm-notes"
                name="notes"
                className="bm-textarea"
                rows={3}
                placeholder="Any special instructions or details…"
                value={form.notes}
                onChange={onChange}
              />
            </div>

            {/* Price hint */}
            {provider?.basePrice != null && (
              <div className="bm-price-hint">
                <span className="bm-price-hint__label">Starting from</span>
                <span className="bm-price-hint__val">
                  ₹{provider.basePrice.toLocaleString("en-IN")}
                  {provider.priceUnit && ` /${provider.priceUnit}`}
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="bm-actions">
              <button type="button" className="bm-btn bm-btn--ghost" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="bm-btn bm-btn--primary" disabled={loading}>
                {loading ? (
                  <span className="bm-spinner" />
                ) : "Confirm Booking"}
              </button>
            </div>

          </form>
        )}

        {/* ─────────────────────────────────────────────────── */}
        {step === 2 && (
          <div className="bm-success">
            <div className="bm-success__icon">🎉</div>
            <h3 className="bm-success__title">Booking Requested!</h3>
            <p className="bm-success__sub">
              Your booking with <strong>{provider?.businessName}</strong> has been
              submitted. You'll be notified once the provider confirms.
            </p>
            <button className="bm-btn bm-btn--primary" onClick={onClose}>
              Done
            </button>
          </div>
        )}

      </div>

      <style>{`
        /* ── Backdrop ── */
        .bm-backdrop {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.45);
          backdrop-filter: blur(3px);
          z-index: 1000;
          animation: bm-fade .2s ease;
        }

        /* ── Modal shell ── */
        .bm-modal {
          position: fixed;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          z-index: 1001;
          background: #fff;
          border-radius: 18px;
          width: min(520px, 94vw);
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 24px 80px rgba(0,0,0,0.18);
          animation: bm-slide .25s cubic-bezier(.16,1,.3,1);
        }

        @keyframes bm-fade  { from { opacity:0 } to { opacity:1 } }
        @keyframes bm-slide {
          from { opacity:0; transform: translate(-50%,-46%) scale(.97) }
          to   { opacity:1; transform: translate(-50%,-50%) scale(1)   }
        }

        /* ── Header ── */
        .bm-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          padding: 24px 24px 20px;
          border-bottom: 1px solid #EBEBEB;
        }
        .bm-header__eyebrow {
          font-size: 10.5px; font-weight: 700;
          letter-spacing: 1.6px; text-transform: uppercase;
          color: #2D6A4F; margin-bottom: 4px;
        }
        .bm-header__title {
          font-size: 19px; font-weight: 800;
          color: #111; letter-spacing: -.4px; margin: 0 0 4px;
        }
        .bm-header__loc { font-size: 12.5px; color: #888; margin: 0; }
        .bm-close {
          background: #F3F3F3; border: none; border-radius: 8px;
          width: 32px; height: 32px; cursor: pointer;
          font-size: 13px; color: #555;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; transition: background .15s;
        }
        .bm-close:hover { background: #EAEAEA; }

        /* ── Form ── */
        .bm-form { padding: 22px 24px 24px; display: flex; flex-direction: column; gap: 18px; }

        .bm-error {
          background: #FFF0F0; border: 1px solid #FFD0CC;
          border-radius: 8px; padding: 10px 14px;
          font-size: 13px; color: #B91C1C;
          display: flex; gap: 8px; align-items: flex-start;
        }

        .bm-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

        .bm-field { display: flex; flex-direction: column; gap: 6px; }
        .bm-label { font-size: 12.5px; font-weight: 600; color: #333; }
        .bm-req   { color: #E53E3E; }
        .bm-opt   { font-weight: 400; color: #999; font-size: 11.5px; }

        .bm-input, .bm-select, .bm-textarea {
          font-family: inherit; font-size: 14px; color: #111;
          background: #FAFAFA; border: 1.5px solid #DCDCDC;
          border-radius: 9px; padding: 10px 13px;
          outline: none; transition: border-color .15s, box-shadow .15s;
          width: 100%; box-sizing: border-box;
        }
        .bm-input:focus, .bm-select:focus, .bm-textarea:focus {
          border-color: #2D6A4F;
          box-shadow: 0 0 0 3px rgba(45,106,79,0.1);
          background: #fff;
        }
        .bm-input--readonly {
          background: #F0F0F0; color: #555;
          font-weight: 600; cursor: default;
          text-transform: capitalize; letter-spacing: 0.2px;
        }

        /* Price hint */
        .bm-price-hint {
          background: #F0FBF4; border: 1px solid #B7E4C7;
          border-radius: 9px; padding: 11px 14px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .bm-price-hint__label { font-size: 12px; color: #2D6A4F; font-weight: 600; }
        .bm-price-hint__val   { font-size: 17px; font-weight: 800; color: #1B4332; }

        /* Actions */
        .bm-actions { display: flex; gap: 10px; justify-content: flex-end; padding-top: 4px; }
        .bm-btn {
          font-family: inherit; font-size: 14px; font-weight: 600;
          padding: 10px 22px; border-radius: 9px; border: none;
          cursor: pointer; transition: background .15s, opacity .15s;
          display: flex; align-items: center; gap: 8px;
        }
        .bm-btn--ghost   { background: #F3F3F3; color: #555; }
        .bm-btn--ghost:hover { background: #EAEAEA; }
        .bm-btn--primary { background: #1B4332; color: #fff; }
        .bm-btn--primary:hover:not(:disabled) { background: #163d2a; }
        .bm-btn--primary:disabled { opacity: .65; cursor: not-allowed; }

        /* Spinner */
        .bm-spinner {
          width: 16px; height: 16px;
          border: 2.5px solid rgba(255,255,255,.35);
          border-top-color: #fff;
          border-radius: 50%;
          animation: bm-spin .7s linear infinite;
          display: inline-block;
        }
        @keyframes bm-spin { to { transform: rotate(360deg); } }

        /* ── Success ── */
        .bm-success {
          padding: 48px 32px 36px;
          text-align: center;
          display: flex; flex-direction: column; align-items: center; gap: 14px;
        }
        .bm-success__icon  { font-size: 52px; }
        .bm-success__title { font-size: 22px; font-weight: 800; color: #111; margin: 0; }
        .bm-success__sub   { font-size: 14px; color: #666; line-height: 1.6; max-width: 340px; margin: 0; }
      `}</style>
    </>
  );
}