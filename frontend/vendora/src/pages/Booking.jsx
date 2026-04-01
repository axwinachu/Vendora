import { useEffect, useState } from "react";
import axios from "../api/axios";
import "../styles/Booking.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

/* ─── Constants ──────────────────────────────────────────── */
const SERVICE_CATEGORIES = {
  PLUMBING:        { label: "Plumbing",         icon: "🔧" },
  ELECTRICAL:      { label: "Electrical",       icon: "⚡" },
  CLEANING:        { label: "Cleaning",         icon: "🧹" },
  CARPENTRY:       { label: "Carpentry",        icon: "🪚" },
  PAINTING:        { label: "Painting",         icon: "🎨" },
  AC_REPAIR:       { label: "AC Repair",        icon: "❄️" },
  APPLIANCE_REPAIR:{ label: "Appliance Repair", icon: "🔌" },
  PEST_CONTROL:    { label: "Pest Control",     icon: "🐛" },
  SALON:           { label: "Salon",            icon: "💇" },
  MASSAGE:         { label: "Massage",          icon: "💆" },
  TUTORING:        { label: "Tutoring",         icon: "📚" },
  PHOTOGRAPHY:     { label: "Photography",      icon: "📷" },
  CATERING:        { label: "Catering",         icon: "🍽️" },
  DRIVING:         { label: "Driving",          icon: "🚗" },
  OTHER:           { label: "Other",            icon: "🛠️" },
};

const BOOKING_STATUSES = [
  { key: "ALL",         label: "All",         icon: "📋" },
  { key: "PENDING",     label: "Pending",     icon: "⏳" },
  { key: "CONFIRMED",   label: "Confirmed",   icon: "✅" },
  { key: "IN_PROGRESS", label: "In Progress", icon: "🔄" },
  { key: "COMPLETED",   label: "Completed",   icon: "🎉" },
  { key: "PAID",        label: "Paid",        icon: "💳" },
  { key: "CANCELED",    label: "Cancelled",   icon: "❌" },
  { key: "REJECTED",    label: "Rejected",    icon: "🚫" },
];

const STATUS_ICON = {
  PENDING: "⏳", CONFIRMED: "✅", IN_PROGRESS: "🔄",
  COMPLETED: "🎉", PAID: "💳", CANCELED: "❌", REJECTED: "🚫",
};
const CancelModal = ({ bookingId, onClose, onConfirm }) => {
  const [reason, setReason] = useState("");
  const [err, setErr] = useState("");
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

/* ─── Booking Detail Panel ───────────────────────────────── */
const BookingDetail = ({ booking, onClose, onCancel }) => {
  const cat = SERVICE_CATEGORIES[booking.serviceCategory] || { label: booking.serviceCategory, icon: "🛠️" };
  const canCancel = ["PENDING", "CONFIRMED"].includes(booking.status);

  return (
    <div className="bk-detail-overlay" onClick={onClose}>
      <div className="bk-detail" onClick={e => e.stopPropagation()}>

        {/* Header */}
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

          {/* Status Banner */}
          <div className={`bk-detail__status-banner bk-status-banner--${booking.status}`}>
            <span className="bk-detail__status-icon">{STATUS_ICON[booking.status]}</span>
            <div>
              <p className="bk-detail__status-label">Status</p>
              <p className="bk-detail__status-val">{booking.status.replace("_", " ")}</p>
            </div>
          </div>

          {/* Info Grid */}
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
                  <span className="bk-detail__row-icon">📅</span>
                  <span className="bk-detail__row-label">Date</span>
                  <span className="bk-detail__row-val">{booking.scheduledDate}</span>
                </div>
                <div className="bk-detail__row">
                  <span className="bk-detail__row-icon">🕐</span>
                  <span className="bk-detail__row-label">Time</span>
                  <span className="bk-detail__row-val">{booking.scheduledTime}</span>
                </div>
                <div className="bk-detail__row">
                  <span className="bk-detail__row-icon">💰</span>
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
                <span>📍</span>
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
                      <span className="bk-detail__row-icon">📝</span>
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
                  <span className="bk-detail__row-icon">🕑</span>
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

        {/* Footer */}
        <div className="bk-modal__footer">
          <button className="bk-btn bk-btn--ghost" onClick={onClose}>Close</button>
          {canCancel && (
            <button className="bk-btn bk-btn--danger" onClick={() => { onClose(); onCancel(booking.id); }}>
              Cancel Booking
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Booking Card ───────────────────────────────────────── */
const BookingCard = ({ booking, onViewDetail, onCancel }) => {
  const cat = SERVICE_CATEGORIES[booking.serviceCategory] || { label: booking.serviceCategory, icon: "🛠️" };
  const canCancel = ["PENDING", "CONFIRMED"].includes(booking.status);

  return (
    <div className={`bk-card bk-card--${booking.status}`}>

      <div className="bk-card__strip">
        <span className="bk-card__cat-tag">{cat.icon} {cat.label}</span>
        <span className={`bk-card__status-badge bk-status--${booking.status}`}>
          {STATUS_ICON[booking.status]} {booking.status.replace("_", " ")}
        </span>
      </div>

      <div className="bk-card__body">
        {/* IDs */}
        <div className="bk-card__ids">
          <span className="bk-card__booking-id">#{booking.id?.slice(0, 8)}…</span>
          <span className="bk-card__created">
            {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : ""}
          </span>
        </div>

        {/* Meta */}
        <div className="bk-card__meta">
          <div className="bk-card__meta-item">
            <span className="bk-card__meta-icon">📅</span>
            <span>{booking.scheduledDate}</span>
          </div>
          <div className="bk-card__meta-item">
            <span className="bk-card__meta-icon">🕐</span>
            <span>{booking.scheduledTime}</span>
          </div>
          <div className="bk-card__meta-item bk-card__meta-item--full">
            <span className="bk-card__meta-icon">📍</span>
            <span className="bk-card__address">{booking.address}</span>
          </div>
          {booking.notes && (
            <div className="bk-card__meta-item bk-card__meta-item--full">
              <span className="bk-card__meta-icon">📝</span>
              <span className="bk-card__notes">{booking.notes}</span>
            </div>
          )}
        </div>

        {/* Cancellation reason pill */}
        {booking.cancellationReason && (
          <div className="bk-card__cancel-reason">
            Reason: {booking.cancellationReason}
          </div>
        )}

        {/* Footer */}
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
  const [bookings, setBookings]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch]           = useState("");
  const [detailBooking, setDetailBooking] = useState(null);
  const [cancelTarget, setCancelTarget]   = useState(null);
  const fetchBookings = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get("/booking/my");
      setBookings(res.data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load bookings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, []);
  const handleCancel = async (id, reason) => {
    try {
      const res = await axios.patch(
        `/booking/${id}/cancel`,
        { reason }
      );
      setBookings(prev => prev.map(b => b.id === id ? res.data : b));
    } catch {
      setError("Failed to cancel booking.");
    }
  };
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
    <Navbar/>
    <div className="bk-page">
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.2">
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
                    {s.key === "ALL"
                      ? bookings.length
                      : bookings.filter(b => b.status === s.key).length}
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
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.2">
                <path d="M23 4v6h-6" />
                <path d="M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
              </svg>
              Refresh
            </button>
          </div>
          {error && (
            <div className="bk-error">
              <span>⚠️</span>
              <span>{error}</span>
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
          onCancel={(id) => { setCancelTarget(id); }}
        />
      )}
      {cancelTarget && (
        <CancelModal
          bookingId={cancelTarget}
          onClose={() => setCancelTarget(null)}
          onConfirm={handleCancel}
        />
      )}
    </div>
    
    </>
  );
};

export default BookingPage;