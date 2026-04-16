import { useEffect, useState } from "react";
import axios from "../api/axios";
import "../styles/Booking.css";
import Navbar from "../components/Navbar";
import PaymentModal from "../stripe/PaymentModal";
import {
  FaWrench,
  FaBolt,
  FaPaintRoller,
  FaTools,
  FaBug,
  FaCar,
  FaBook,
  FaCamera,
  FaUtensils
} from "react-icons/fa";

import {
  MdCleaningServices,
  MdElectricalServices,
  MdLocationOn,
  MdPayment,
  MdCancel,
  MdCheckCircle,
  MdPendingActions,
  MdAccessTime,
  MdSchedule,
  MdMoney,
  MdNotes,
  MdBook
} from "react-icons/md";

import { BsSnow } from "react-icons/bs";
import { GiWoodBeam } from "react-icons/gi";
/* ─── Constants ──────────────────────────────────────────── */
const SERVICE_CATEGORIES = {
  PLUMBING:        { label: "Plumbing",         icon: <FaWrench /> },
  ELECTRICAL:      { label: "Electrical",       icon: <FaBolt /> },
  CLEANING:        { label: "Cleaning",         icon: <MdCleaningServices /> },
  CARPENTRY:       { label: "Carpentry",        icon: <GiWoodBeam /> },
  PAINTING:        { label: "Painting",         icon: <FaPaintRoller /> },
  AC_REPAIR:       { label: "AC Repair",        icon: <BsSnow /> },
  APPLIANCE_REPAIR:{ label: "Appliance Repair", icon: <FaTools /> },
  PEST_CONTROL:    { label: "Pest Control",     icon: <FaBug /> },
  SALON:           { label: "Salon",            icon: <FaTools /> },
  MASSAGE:         { label: "Massage",          icon: <FaTools /> },
  TUTORING:        { label: "Tutoring",         icon: <FaBook /> },
  PHOTOGRAPHY:     { label: "Photography",      icon: <FaCamera /> },
  CATERING:        { label: "Catering",         icon: <FaUtensils /> },
  DRIVING:         { label: "Driving",          icon: <FaCar /> },
  OTHER:           { label: "Other",            icon: <FaTools /> },
};

const BOOKING_STATUSES = [
  { key: "ALL",         label: "All",         icon: <FaTools /> },
  { key: "PENDING",     label: "Pending",     icon: <MdPendingActions /> },
  { key: "CONFIRMED",   label: "Confirmed",   icon: <MdCheckCircle /> },
  { key: "IN_PROGRESS", label: "In Progress", icon: <MdSchedule /> },
  { key: "COMPLETED",   label: "Completed",   icon: <MdCheckCircle /> },
  { key: "PAID",        label: "Paid",        icon: <MdPayment /> },
  { key: "CANCELED",    label: "Cancelled",   icon: <MdCancel /> },
  { key: "REJECTED",    label: "Rejected",    icon: <MdCancel /> },
];

const STATUS_ICON = {
  PENDING: <MdPendingActions />,
  CONFIRMED: <MdCheckCircle />,
  IN_PROGRESS: <MdSchedule />,
  COMPLETED: <MdCheckCircle />,
  PAID: <MdPayment />,
  CANCELED: <MdCancel />,
  REJECTED: <MdCancel />,
};

const STAR_LABELS = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

/* ─── Star Rating Component ──────────────────────────────── */
const StarRating = ({ value, hovered, onHover, onLeave, onChange }) => {
  const display = hovered || value;
  return (
    <div className="bk-stars">
      <div className="bk-stars__row">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            className={[
              "bk-stars__btn",
              star <= display      ? "bk-stars__btn--lit"     : "",
              star <= hovered      ? "bk-stars__btn--hovered" : "",
              star === value && !hovered ? "bk-stars__btn--selected" : "",
            ].join(" ")}
            onMouseEnter={() => onHover(star)}
            onMouseLeave={onLeave}
            onClick={() => onChange(star)}
            aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
          >
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </button>
        ))}
      </div>
      <span className={`bk-stars__label ${display > 0 ? "bk-stars__label--visible" : ""}`}>
        {display > 0 ? STAR_LABELS[display] : "Select a rating"}
      </span>
    </div>
  );
};

/* ─── Reviewed Badge ─────────────────────────────────────── */
const ReviewedBadge = ({ rating }) => (
  <div className="bk-reviewed-badge">
    <div className="bk-reviewed-badge__inner">
      <div className="bk-reviewed-badge__stars">
        {[1, 2, 3, 4, 5].map(s => (
          <svg
            key={s}
            className={`bk-reviewed-badge__star ${s <= rating ? "bk-reviewed-badge__star--on" : ""}`}
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ))}
        <span className="bk-reviewed-badge__num">{rating}/5</span>
      </div>
      <span className="bk-reviewed-badge__text">✓ You reviewed this booking</span>
    </div>
  </div>
);

/* ─── Cancel Modal ───────────────────────────────────────── */
const CancelModal = ({ bookingId, onClose, onConfirm }) => {
  const [reason, setReason]   = useState("");
  const [err, setErr]         = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!reason.trim()) { setErr("Please provide a reason"); return; }
    setLoading(true);
    await onConfirm(bookingId, reason);
    setLoading(false);
    onClose();
  };

  return (
    <div className="bk-modal-overlay" onClick={onClose}>
      <div className="bk-modal bk-modal--sm" onClick={e => e.stopPropagation()}>
        <div className="bk-modal__header">
          <div>
            <div className="bk-modal__eyebrow">Cancellation</div>
            <h2 className="bk-modal__title">Cancel Booking</h2>
          </div>
          <button className="bk-modal__close" onClick={onClose}>✕</button>
        </div>
        <div className="bk-modal__body">
          <p className="bk-cancel-warn">
            ⚠️ This action cannot be undone. Please tell us why you're cancelling.
          </p>
          <div className="bk-field">
            <label className="bk-label">Reason for Cancellation</label>
            <textarea
              className={`bk-textarea ${err ? "bk-input--error" : ""}`}
              rows={3}
              placeholder="e.g. Schedule conflict, found another provider…"
              value={reason}
              onChange={e => { setReason(e.target.value); setErr(""); }}
            />
            {err && <span className="bk-err">{err}</span>}
          </div>
        </div>
        <div className="bk-modal__footer">
          <button className="bk-btn bk-btn--ghost" onClick={onClose}>Keep Booking</button>
          <button
            className={`bk-btn bk-btn--danger ${loading ? "bk-btn--loading" : ""}`}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? <><div className="bk-spinner" />Cancelling…</> : "Cancel Booking"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Review Modal ───────────────────────────────────────── */
const ReviewModal = ({ booking, onClose, onSubmit }) => {
  const [rating, setRating]     = useState(0);
  const [hovered, setHovered]   = useState(0);
  const [reviewText, setReview] = useState("");
  const [err, setErr]           = useState("");
  const [loading, setLoading]   = useState(false);

  const cat = SERVICE_CATEGORIES[booking.serviceCategory] || { label: booking.serviceCategory, icon: "🛠️" };

  const handleClose = () => {
    setRating(0); setHovered(0); setReview(""); setErr("");
    onClose();
  };

  const handleSubmit = async () => {
    if (rating === 0)       { setErr("Please select a star rating."); return; }
    if (!reviewText.trim()) { setErr("Please write a review before submitting."); return; }
    setLoading(true); setErr("");
    try {
      await onSubmit({
        bookingId:  booking.id,
        providerId: booking.providerId,
        rating,
        comment: reviewText.trim(),
      });
      handleClose();
    } catch (e) {
      const d = e?.response?.data;
      setErr(
        typeof d === "string"            ? d
        : typeof d?.message === "string" ? d.message
        : typeof d?.error   === "string" ? d.error
        : "Failed to submit review. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bk-modal-overlay" onClick={handleClose}>
      <div className="bk-modal bk-modal--review" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="bk-modal__header">
          <div>
            <div className="bk-modal__eyebrow">{cat.icon} {cat.label}</div>
            <h2 className="bk-modal__title">Write a Review</h2>
          </div>
          <button className="bk-modal__close" onClick={handleClose}>✕</button>
        </div>

        <div className="bk-modal__body">

          {/* Booking mini-summary */}
          <div className="bk-review__summary">
            <span className="bk-review__summary-id">#{booking.id?.slice(0, 8)}…</span>
            <span className="bk-review__summary-dot">·</span>
            <span>{booking.scheduledDate}</span>
            {booking.basePrice && (
              <><span className="bk-review__summary-dot">·</span><span>₹{booking.basePrice}</span></>
            )}
          </div>

          {/* Stars */}
          <div className="bk-field">
            <label className="bk-label">Your Rating</label>
            <StarRating
              value={rating}
              hovered={hovered}
              onHover={setHovered}
              onLeave={() => setHovered(0)}
              onChange={(s) => { setRating(s); setErr(""); }}
            />
          </div>

          {/* Review text */}
          <div className="bk-field" style={{ marginTop: "18px" }}>
            <label className="bk-label">Your Review</label>
            <textarea
              className={`bk-textarea ${err && !reviewText.trim() ? "bk-input--error" : ""}`}
              rows={4}
              maxLength={500}
              placeholder="Share your experience — quality of work, punctuality, professionalism…"
              value={reviewText}
              onChange={e => { setReview(e.target.value); setErr(""); }}
            />
            <div className="bk-review__char-count">
              <span className={reviewText.length > 450 ? "bk-review__char-count--warn" : ""}>
                {reviewText.length}
              </span>{" / 500"}
            </div>
          </div>

          {/* Error */}
          {err && (
            <div className="bk-review__err">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {err}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bk-modal__footer">
          <button className="bk-btn bk-btn--ghost" onClick={handleClose}>Cancel</button>
          <button
            className={`bk-btn bk-btn--primary ${loading ? "bk-btn--loading" : ""}`}
            onClick={handleSubmit}
            disabled={loading || rating === 0 || !reviewText.trim()}
          >
            {loading ? <><div className="bk-spinner" /> Submitting…</> : "Submit Review"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Booking Detail Panel ───────────────────────────────── */
const BookingDetail = ({ booking, onClose, onCancel, onPay, payingId }) => {
  const cat          = SERVICE_CATEGORIES[booking.serviceCategory] || { label: booking.serviceCategory, icon: "🛠️" };
  const canCancel    = ["PENDING", "CONFIRMED"].includes(booking.status);
  const canPay       = booking.status === "COMPLETED";
  const isPayingThis = payingId === booking.id;

  return (
    <div className="bk-detail-overlay" onClick={onClose}>
      <div className="bk-detail" onClick={e => e.stopPropagation()}>
        <div className="bk-detail__header">
          <div className="bk-detail__header-left">
            <span className="bk-detail__cat-icon">{cat.icon}</span>
            <div>
              <div className="bk-modal__eyebrow">{cat.label}</div>
              <h2 className="bk-modal__title">Booking Details</h2>
            </div>
          </div>
          <button className="bk-modal__close" onClick={onClose}>✕</button>
        </div>

        <div className="bk-detail__body">
          <div className={`bk-detail__status-banner bk-status-banner--${booking.status}`}>
            <span className="bk-detail__status-icon">{STATUS_ICON[booking.status]}</span>
            <div>
              <p className="bk-detail__status-label">Status</p>
              <p className="bk-detail__status-val">{booking.status.replace("_", " ")}</p>
            </div>
          </div>

          <div className="bk-detail__grid">
            <div className="bk-detail__section">
              <p className="bk-detail__section-title">Booking Info</p>
              <div className="bk-detail__rows">
                <div className="bk-detail__row">
                  <span className="bk-detail__row-icon">🪪</span>
                  <span className="bk-detail__row-label">Booking ID</span>
                  <span className="bk-detail__row-val bk-detail__row-val--mono">{booking.id}</span>
                </div>
                <div className="bk-detail__row">
                  <span className="bk-detail__row-icon">🛠️</span>
                  <span className="bk-detail__row-label">Service</span>
                  <span className="bk-detail__row-val">{cat.icon} {cat.label}</span>
                </div>
                <div className="bk-detail__row">
                  <span className="bk-detail__row-icon">👤</span>
                  <span className="bk-detail__row-label">Provider ID</span>
                  <span className="bk-detail__row-val bk-detail__row-val--mono">{booking.providerId}</span>
                </div>
              </div>
            </div>

            <div className="bk-detail__section">
              <p className="bk-detail__section-title">Schedule</p>
              <div className="bk-detail__rows">
                <div className="bk-detail__row">
                  <span className="bk-detail__row-icon"><MdLocationOn /></span>
                  <span className="bk-detail__row-label"><MdSchedule /></span>
                  <span className="bk-detail__row-val">{booking.scheduledDate}</span>
                </div>
                <div className="bk-detail__row">
                  <span className="bk-detail__row-icon"><MdSchedule/></span>
                  <span className="bk-detail__row-label">Time</span>
                  <span className="bk-detail__row-val">{booking.scheduledTime}</span>
                </div>
                <div className="bk-detail__row">
                  <span className="bk-detail__row-icon"><MdMoney/></span>
                  <span className="bk-detail__row-label">Base Price</span>
                  <span className="bk-detail__row-val bk-detail__row-val--price">
                    {booking.basePrice ? `₹${booking.basePrice}` : "—"}
                  </span>
                </div>
              </div>
            </div>

            <div className="bk-detail__section bk-detail__section--full">
              <p className="bk-detail__section-title">Location</p>
              <div className="bk-detail__address-box">
                <span><MdLocationOn/></span>
                <span>{booking.address || "—"}</span>
              </div>
            </div>

            {booking.notes && (
              <div className="bk-detail__section bk-detail__section--full">
                <p className="bk-detail__section-title">Notes</p>
                <p className="bk-detail__notes">{booking.notes}</p>
              </div>
            )}

            {(booking.cancelledBy || booking.cancellationReason) && (
              <div className="bk-detail__section bk-detail__section--full">
                <p className="bk-detail__section-title">Cancellation</p>
                <div className="bk-detail__cancel-info">
                  {booking.cancelledBy && (
                    <div className="bk-detail__row">
                      <span className="bk-detail__row-icon">👤</span>
                      <span className="bk-detail__row-label">Cancelled By</span>
                      <span className="bk-detail__row-val">{booking.cancelledBy}</span>
                    </div>
                  )}
                  {booking.cancellationReason && (
                    <div className="bk-detail__row">
                      <span className="bk-detail__row-icon"><MdNotes/></span>
                      <span className="bk-detail__row-label">Reason</span>
                      <span className="bk-detail__row-val">{booking.cancellationReason}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="bk-detail__section bk-detail__section--full">
              <p className="bk-detail__section-title">Timestamps</p>
              <div className="bk-detail__rows">
                <div className="bk-detail__row">
                  <span className="bk-detail__row-icon"><MdSchedule/></span>
                  <span className="bk-detail__row-label">Created</span>
                  <span className="bk-detail__row-val bk-detail__row-val--mono">
                    {booking.createdAt ? new Date(booking.createdAt).toLocaleString() : "—"}
                  </span>
                </div>
                <div className="bk-detail__row">
                  <span className="bk-detail__row-icon">🔄</span>
                  <span className="bk-detail__row-label">Updated</span>
                  <span className="bk-detail__row-val bk-detail__row-val--mono">
                    {booking.updatedAt ? new Date(booking.updatedAt).toLocaleString() : "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bk-modal__footer">
          <button className="bk-btn bk-btn--ghost" onClick={onClose}>Close</button>
          {canCancel && (
            <button className="bk-btn bk-btn--danger"
              onClick={() => { onClose(); onCancel(booking.id); }}>
              Cancel Booking
            </button>
          )}
          {canPay && (
            <button
              className={`bk-btn bk-btn--primary ${isPayingThis ? "bk-btn--loading" : ""}`}
              onClick={() => { onClose(); onPay(booking.id); }}
              disabled={isPayingThis}
            >
              {isPayingThis ? <><div className="bk-spinner" /> Loading…</> : "💳 Pay Now"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Booking Card ───────────────────────────────────────── */
const BookingCard = ({ booking, onViewDetail, onCancel, onPay, payingId, onReview, reviewedMap }) => {
  const cat          = SERVICE_CATEGORIES[booking.serviceCategory] || { label: booking.serviceCategory, icon: "🛠️" };
  const canCancel    = ["PENDING", "CONFIRMED"].includes(booking.status);
  const canPay       = booking.status === "COMPLETED";
  const isPayingThis = payingId === booking.id;
  const reviewInfo   = reviewedMap[booking.id];           // { rating, comment } or undefined
  const canReview    = booking.status === "PAID" && !reviewInfo;
  const hasReviewed  = booking.status === "PAID" && !!reviewInfo;

  return (
    <div className={`bk-card bk-card--${booking.status}`}>

      <div className="bk-card__strip">
        <span className="bk-card__cat-tag">{cat.icon} {cat.label}</span>
        <span className={`bk-card__status-badge bk-status--${booking.status}`}>
          {STATUS_ICON[booking.status]} {booking.status.replace("_", " ")}
        </span>
      </div>

      <div className="bk-card__body">
        <div className="bk-card__ids">
          <span className="bk-card__booking-id">#{booking.id?.slice(0, 8)}…</span>
          <span className="bk-card__created">
            {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : ""}
          </span>
        </div>

        <div className="bk-card__meta">
          <div className="bk-card__meta-item">
            <span className="bk-card__meta-icon"><MdSchedule />
          </span>
            <span>{booking.scheduledDate}</span>
          </div>
          <div className="bk-card__meta-item">
            <span className="bk-card__meta-icon"><MdAccessTime /></span>
            <span>{booking.scheduledTime}</span>
          </div>
          <div className="bk-card__meta-item bk-card__meta-item--full">
            <span className="bk-card__meta-icon"><MdLocationOn/></span>
            <span className="bk-card__address">{booking.address}</span>
          </div>
          {booking.notes && (
            <div className="bk-card__meta-item bk-card__meta-item--full">
              <span className="bk-card__meta-icon"><MdBook/></span>
              <span className="bk-card__notes">{booking.notes}</span>
            </div>
          )}
        </div>

        {booking.cancellationReason && (
          <div className="bk-card__cancel-reason">
            Reason: {booking.cancellationReason}
          </div>
        )}

        {/* Reviewed badge — appears below order info, above footer */}
        {hasReviewed && <ReviewedBadge rating={reviewInfo.rating} />}

        <div className="bk-card__footer">
          <div className="bk-card__price">
            <span className="bk-card__price-from">Base Price</span>
            <span className="bk-card__price-val">
              {booking.basePrice ? `₹${booking.basePrice}` : "TBD"}
            </span>
          </div>
          <div className="bk-card__actions">
            {canCancel && (
              <button className="bk-btn bk-btn--danger-ghost" onClick={() => onCancel(booking.id)}>
                Cancel
              </button>
            )}
            <button className="bk-btn bk-btn--outline" onClick={() => onViewDetail(booking)}>
              View Details
            </button>
            {canPay && (
              <button
                className={`bk-btn bk-btn--primary ${isPayingThis ? "bk-btn--loading" : ""}`}
                onClick={() => onPay(booking.id)}
                disabled={isPayingThis}
              >
                {isPayingThis ? <><div className="bk-spinner" /> Loading…</> : "💳 Pay Now"}
              </button>
            )}
            {/* Write Review — hidden once reviewed */}
            {canReview && (
              <button className="bk-btn bk-btn--review" onClick={() => onReview(booking)}>
                ⭐ Write Review
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Skeleton ───────────────────────────────────────────── */
const SkeletonCard = () => (
  <div className="bk-skeleton">
    <div className="bk-skeleton__strip" />
    <div className="bk-skeleton__body">
      <div className="bk-skeleton__line bk-skeleton__line--60" />
      <div className="bk-skeleton__line bk-skeleton__line--100" />
      <div className="bk-skeleton__line bk-skeleton__line--80" />
      <div className="bk-skeleton__line bk-skeleton__line--40" />
    </div>
  </div>
);

/* ─── Main Page ──────────────────────────────────────────── */
const BookingPage = () => {
  const [bookings, setBookings]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState("");
  const [statusFilter, setStatusFilter]   = useState("ALL");
  const [search, setSearch]               = useState("");
  const [detailBooking, setDetailBooking] = useState(null);
  const [cancelTarget, setCancelTarget]   = useState(null);
  const [paymentData, setPaymentData]     = useState(null);
  const [payingId, setPayingId]           = useState(null);
  const [reviewBooking, setReviewBooking] = useState(null);

  /*
   * reviewedMap: { [bookingId]: { rating, comment } }
   * Pre-populated from the backend on load so the button stays hidden
   * even after a page refresh.
   */
  const [reviewedMap, setReviewedMap] = useState({});

  /* ── Build reviewedMap from existing reviews for PAID bookings ── */
  const fetchReviewedMap = async (paidBookings) => {
    if (!paidBookings.length) return;

    // Group paid bookings by providerId to batch review lookups
    const providerIds = [...new Set(paidBookings.map(b => b.providerId))];

    const results = await Promise.allSettled(
      providerIds.map(pid => axios.get(`/review/provider/${pid}`))
    );

    const map = {};
    results.forEach((result, idx) => {
      if (result.status !== "fulfilled") return;
      const reviews = result.value.data; // array of Review objects
      reviews.forEach(r => {
        // Match review back to a booking by bookingId
        map[r.bookingId] = { rating: r.rating, comment: r.comment };
      });
    });

    setReviewedMap(map);
  };

  /* ── Fetch bookings ── */
  const fetchBookings = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get("/booking/my");
      setBookings(res.data);
      // Hydrate reviewedMap for any PAID bookings so the button is hidden on load
      const paidBookings = res.data.filter(b => b.status === "PAID");
      await fetchReviewedMap(paidBookings);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load bookings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  /* ── Cancel booking ── */
  const handleCancel = async (id, reason) => {
    try {
      const res = await axios.patch(`/booking/${id}/cancel`, { reason });
      setBookings(prev => prev.map(b => b.id === id ? res.data : b));
    } catch {
      setError("Failed to cancel booking.");
    }
  };

  /* ── Initiate payment ── */
  const handlePay = async (bookingId) => {
    setPayingId(bookingId);
    setError("");
    try {
      const res = await axios.post("/payments/create", { bookingId });
      setPaymentData({ clientSecret: res.data.clientSecret, paymentIntentId: res.data.paymentIntentId });
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to initiate payment. Please try again.");
      setPayingId(null);
    }
  };

  const handlePaymentSuccess = () => { setPaymentData(null); setPayingId(null); fetchBookings(); };
  const handlePaymentClose   = () => { setPaymentData(null); setPayingId(null); };

  /* ── Submit review ── */
  const handleReviewSubmit = async ({ bookingId, providerId, rating, comment }) => {
    // Throws on failure — ReviewModal catches and shows error inline
    await axios.post("/review/add", { bookingId, providerId, rating, comment });
    // Mark locally so button hides immediately without waiting for re-fetch
    setReviewedMap(prev => ({ ...prev, [bookingId]: { rating, comment } }));
    fetchBookings();
  };

  /* ── Filtering ── */
  const filtered = bookings.filter(b => {
    const matchStatus = statusFilter === "ALL" || b.status === statusFilter;
    const matchSearch = !search.trim()
      || b.id?.toLowerCase().includes(search.toLowerCase())
      || b.address?.toLowerCase().includes(search.toLowerCase())
      || b.providerId?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const stats = {
    total:     bookings.length,
    active:    bookings.filter(b => ["PENDING","CONFIRMED","IN_PROGRESS"].includes(b.status)).length,
    completed: bookings.filter(b => ["COMPLETED","PAID"].includes(b.status)).length,
  };

  return (
    <>
      <Navbar />
      <div className="bk-page">

        {/* ── Hero ── */}
        <section className="bk-hero">
          <div className="bk-hero__inner">
            <div className="bk-hero__left">
              <div className="bk-hero__eyebrow">
                <span className="bk-hero__eyebrow-dot" />
                My Bookings
              </div>
              <h1 className="bk-hero__title">
                Track &amp; Manage <em>Your Services</em>
              </h1>
              <p className="bk-hero__sub">
                View all your past and upcoming bookings, track their status, view full details, or cancel if needed.
              </p>
              <div className="bk-hero__search">
                <span className="bk-hero__search-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                  </svg>
                </span>
                <input
                  className="bk-hero__search-input"
                  placeholder="Search by booking ID, address or provider…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                {search && (
                  <button className="bk-hero__search-clear" onClick={() => setSearch("")}>✕</button>
                )}
              </div>
            </div>

            <div className="bk-hero__stats">
              <div className="bk-hero__stat">
                <span className="bk-hero__stat-num">{loading ? "—" : stats.total}</span>
                <span className="bk-hero__stat-label">Total</span>
              </div>
              <div className="bk-hero__stat">
                <span className="bk-hero__stat-num">{loading ? "—" : stats.active}</span>
                <span className="bk-hero__stat-label">Active</span>
              </div>
              <div className="bk-hero__stat">
                <span className="bk-hero__stat-num">{loading ? "—" : stats.completed}</span>
                <span className="bk-hero__stat-label">Done</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Body ── */}
        <div className="bk-body">

          <aside className="bk-sidebar">
            <div className="bk-sidebar__block">
              <p className="bk-sidebar__title">Filter by Status</p>
              <div className="bk-sidebar__cats">
                {BOOKING_STATUSES.map(s => (
                  <button
                    key={s.key}
                    className={`bk-sidebar__cat ${statusFilter === s.key ? "bk-sidebar__cat--active" : ""}`}
                    onClick={() => setStatusFilter(s.key)}
                  >
                    <span>{s.icon}</span>
                    <span>{s.label}</span>
                    <span className="bk-sidebar__cat-count">
                      {s.key === "ALL" ? bookings.length : bookings.filter(b => b.status === s.key).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <div className="bk-content">
            <div className="bk-toolbar">
              <div className="bk-toolbar__left">
                <p className="bk-toolbar__count">
                  {loading ? "Loading…" : `${filtered.length} Booking${filtered.length !== 1 ? "s" : ""}`}
                </p>
                <p className="bk-toolbar__sub">
                  {statusFilter !== "ALL"
                    ? `Filtered: ${BOOKING_STATUSES.find(s => s.key === statusFilter)?.label}`
                    : "Showing all bookings"}
                </p>
              </div>
              <button className="bk-btn bk-btn--ghost bk-btn--icon" onClick={fetchBookings} title="Refresh">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
                  <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
                </svg>
                Refresh
              </button>
            </div>

            {error && (
              <div className="bk-error">
                <span>⚠️</span><span>{error}</span>
                <button className="bk-btn bk-btn--ghost" onClick={fetchBookings}>Retry</button>
              </div>
            )}

            <div className="bk-grid">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
              ) : filtered.length === 0 ? (
                <div className="bk-empty">
                  <span className="bk-empty__icon">📭</span>
                  <h3 className="bk-empty__title">
                    {bookings.length === 0 ? "No bookings yet" : "No bookings match your filter"}
                  </h3>
                  <p className="bk-empty__sub">
                    {bookings.length === 0
                      ? "Once you book a service, it will appear here."
                      : "Try selecting a different status filter."}
                  </p>
                  {bookings.length > 0 && statusFilter !== "ALL" && (
                    <button className="bk-btn bk-btn--outline" onClick={() => setStatusFilter("ALL")}>
                      Show All Bookings
                    </button>
                  )}
                </div>
              ) : (
                filtered.map((b, i) => (
                  <div key={b.id} style={{ animationDelay: `${i * 0.05}s` }}>
                    <BookingCard
                      booking={b}
                      onViewDetail={setDetailBooking}
                      onCancel={setCancelTarget}
                      onPay={handlePay}
                      payingId={payingId}
                      onReview={setReviewBooking}
                      reviewedMap={reviewedMap}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {detailBooking && (
          <BookingDetail
            booking={detailBooking}
            onClose={() => setDetailBooking(null)}
            onCancel={(id) => { setDetailBooking(null); setCancelTarget(id); }}
            onPay={(id)    => { setDetailBooking(null); handlePay(id); }}
            payingId={payingId}
          />
        )}

        {cancelTarget && (
          <CancelModal
            bookingId={cancelTarget}
            onClose={() => setCancelTarget(null)}
            onConfirm={handleCancel}
          />
        )}

        {paymentData && (
          <PaymentModal
            clientSecret={paymentData.clientSecret}
            paymentIntentId={paymentData.paymentIntentId}
            onSuccess={handlePaymentSuccess}
            onClose={handlePaymentClose}
          />
        )}

        {reviewBooking && (
          <ReviewModal
            booking={reviewBooking}
            onClose={() => setReviewBooking(null)}
            onSubmit={handleReviewSubmit}
          />
        )}

      </div>
    </>
  );
};

export default BookingPage;