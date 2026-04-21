import { useState, useRef, useEffect, useCallback } from "react";
import axios from "../api/axios";
import "../styles/otp.css";

const MAX_ATTEMPTS = 3;
const OTP_TTL = 5 * 60;

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

const LockIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const CheckIcon = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const AlertIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const CloseIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const SpinIcon = () => (
  <svg className="otp-spin-icon" width="15" height="15" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M21 12a9 9 0 1 1-6.22-8.56" />
  </svg>
);

const ClockIcon = ({ urgent }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke={urgent ? "#EF4444" : "#94A3B8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export default function OtpVerificationModal({ bookingId, onSuccess, onClose }) {
  const [digits, setDigits]     = useState(Array(6).fill(""));
  const [phase, setPhase]       = useState("idle");
  const [attempts, setAttempts] = useState(0);
  const [msg, setMsg]           = useState({ text: "", type: "" });
  const [timeLeft, setTimeLeft] = useState(OTP_TTL);
  const [shakeKey, setShakeKey] = useState(0);
  const [mounted, setMounted]   = useState(false);

  const refs    = useRef([]);
  const timerFn = useRef(null);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
    setTimeout(() => refs.current[0]?.focus(), 120);
  }, []);

  const startTimer = useCallback(() => {
    clearInterval(timerFn.current);
    setTimeLeft(OTP_TTL);
    timerFn.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerFn.current);
          setPhase("expired");
          setMsg({ text: "OTP expired. Please resend.", type: "err" });
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => { startTimer(); return () => clearInterval(timerFn.current); }, [startTimer]);

  const dismiss = () => { setMounted(false); setTimeout(() => onClose?.(), 280); };

  const onChange = (i, val) => {
    const c = val.replace(/\D/g, "").slice(-1);
    const n = [...digits]; n[i] = c; setDigits(n);
    if (c && i < 5) refs.current[i + 1]?.focus();
  };

  const onKeyDown = (i, e) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      const n = [...digits]; n[i - 1] = ""; setDigits(n);
      refs.current[i - 1]?.focus();
    }
    if (e.key === "Enter") verify();
  };

  const onPaste = (e) => {
    e.preventDefault();
    const p = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const n = Array(6).fill("");
    p.split("").forEach((c, i) => { n[i] = c; });
    setDigits(n);
    setTimeout(() => refs.current[Math.min(p.length, 5)]?.focus(), 10);
  };

  const otp        = digits.join("");
  const complete   = otp.length === 6;
  const locked     = phase === "blocked";
  const expired    = phase === "expired";
  const success    = phase === "success";
  const verifying  = phase === "verifying";
  const resending  = phase === "resending";
  const inputOff   = verifying || success || locked || resending;
  const urgent     = timeLeft <= 60 && !expired && !success && !locked;
  const shortId    = (bookingId || "").slice(-8).toUpperCase() || "--------";

  const verify = async () => {
    if (!complete || verifying) return;
    setPhase("verifying"); setMsg({ text: "", type: "" });
    try {
      const res = await axios.post(`/booking/${bookingId}/verify-otp`, null, { params: { otp } });
      clearInterval(timerFn.current);
      setPhase("success");
      setTimeout(() => onSuccess?.(res.data), 1600);
    } catch (err) {
      const errMsg = err?.response?.data?.message || "";
      const na = attempts + 1;
      setAttempts(na);
      if (err?.response?.status === 429 || errMsg.toLowerCase().includes("blocked") || na >= MAX_ATTEMPTS) {
        clearInterval(timerFn.current); setPhase("blocked");
      } else if (errMsg.toLowerCase().includes("expired")) {
        setPhase("expired"); setMsg({ text: "OTP expired. Resend a new one.", type: "err" });
      } else {
        setPhase("error");
        setMsg({ text: `Wrong OTP — ${MAX_ATTEMPTS - na} attempt${MAX_ATTEMPTS - na === 1 ? "" : "s"} left.`, type: "err" });
        setDigits(Array(6).fill(""));
        setShakeKey(k => k + 1);
        setTimeout(() => { setPhase("idle"); refs.current[0]?.focus(); }, 650);
      }
    }
  };

  const resend = async () => {
    setPhase("resending"); setMsg({ text: "", type: "" });
    try {
      await axios.post(`/booking/${bookingId}/resend-otp`);
      setAttempts(0); setDigits(Array(6).fill(""));
      setPhase("idle");
      setMsg({ text: "Fresh OTP sent to customer.", type: "ok" });
      startTimer();
      setTimeout(() => { setMsg({ text: "", type: "" }); refs.current[0]?.focus(); }, 3000);
    } catch {
      setPhase("idle"); setMsg({ text: "Resend failed. Try again.", type: "err" });
    }
  };

  return (
    <div className={`otp-backdrop ${mounted ? "otp-backdrop--in" : ""}`} onClick={e => e.target === e.currentTarget && dismiss()}>
      <div className={`otp-card ${mounted ? "otp-card--in" : ""}`} role="dialog" aria-modal="true" aria-label="OTP Verification">

        {/* close btn */}
        {!success && (
          <button className="otp-x" onClick={dismiss} aria-label="Close"><CloseIcon /></button>
        )}

        {/* ── SUCCESS ── */}
        {success && (
          <div className="otp-screen otp-screen--success">
            <div className="otp-stamp otp-stamp--ok"><CheckIcon /></div>
            <h2 className="otp-screen__title">Job Completed</h2>
            <p className="otp-screen__body">
              OTP verified. Booking marked as&nbsp;
              <span className="otp-hl otp-hl--green">Completed</span>.
            </p>
            <div className="otp-chip otp-chip--green">
              <span className="otp-chip__dot" /> #{shortId} · Done
            </div>
          </div>
        )}

        {/* ── BLOCKED ── */}
        {locked && (
          <div className="otp-screen otp-screen--danger">
            <div className="otp-stamp otp-stamp--err"><AlertIcon /></div>
            <h2 className="otp-screen__title">Verification Locked</h2>
            <p className="otp-screen__body">
              3 failed attempts. Booking will auto-revert to&nbsp;
              <span className="otp-hl otp-hl--amber">In Progress</span>&nbsp;
              in ~10 min via the scheduled reaper job.
            </p>
            <div className="otp-chip otp-chip--red">
              <span className="otp-chip__dot otp-chip__dot--red" /> Auto-revert in ~10 min
            </div>
          </div>
        )}

        {/* ── MAIN ── */}
        {!success && !locked && (
          <div className="otp-body">

            {/* header row */}
            <div className="otp-hdr">
              <div className="otp-hdr__icon"><LockIcon /></div>
              <div>
                <h2 className="otp-hdr__title">Enter OTP</h2>
                <p className="otp-hdr__sub">Ask the customer for the 6-digit code.</p>
              </div>
            </div>

            {/* booking chip */}
            <div className="otp-chip">
              <span className="otp-chip__dot otp-chip__dot--gray" /> Booking #{shortId}
            </div>

            {/* digit inputs */}
            <div className="otp-digits-wrap" key={shakeKey}>
              <div className={`otp-digits ${phase === "error" ? "otp-digits--shake" : ""}`}>
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={el => refs.current[i] = el}
                    className={[
                      "otp-digit",
                      d ? "otp-digit--on" : "",
                      phase === "error" ? "otp-digit--err" : "",
                    ].filter(Boolean).join(" ")}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    disabled={inputOff}
                    autoComplete={i === 0 ? "one-time-code" : "off"}
                    onChange={e => onChange(i, e.target.value)}
                    onKeyDown={e => onKeyDown(i, e)}
                    onPaste={i === 0 ? onPaste : undefined}
                  />
                ))}
              </div>
            </div>

            {/* timer */}
            <div className={`otp-timer ${urgent ? "otp-timer--urgent" : ""} ${expired ? "otp-timer--dead" : ""}`}>
              <ClockIcon urgent={urgent || expired} />
              {expired ? "OTP expired" : `Expires in ${formatTime(timeLeft)}`}
            </div>

            {/* attempts */}
            <div className="otp-tries">
              <span className="otp-tries__label">Attempts</span>
              <div className="otp-tries__pips">
                {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
                  <span key={i} className={`otp-pip ${i < attempts ? "otp-pip--used" : ""}`} />
                ))}
              </div>
              <span className="otp-tries__num">{attempts}/{MAX_ATTEMPTS}</span>
            </div>

            {/* message */}
            {msg.text && (
              <p className={`otp-msg otp-msg--${msg.type}`}>{msg.text}</p>
            )}

            {/* verify */}
            <button
              className={`otp-btn otp-btn--primary ${(!complete || inputOff || expired) ? "otp-btn--off" : ""}`}
              onClick={verify}
              disabled={!complete || inputOff || expired}
            >
              {verifying ? <><SpinIcon /> Verifying…</> : "Verify OTP"}
            </button>

            {/* resend */}
            <div className="otp-resend">
              <span className="otp-resend__q">Didn't receive it?</span>
              <button
                className="otp-resend__btn"
                onClick={resend}
                disabled={verifying || resending || success || locked}
              >
                {resending ? <><SpinIcon /> Sending…</> : "Resend OTP"}
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}