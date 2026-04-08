import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axios";
import "../styles/dashboard.css";

/* ─── Auth helper ────────────────────────────────────────── */
function getUser() {
  try { return JSON.parse(localStorage.getItem("user_profile") || "{}"); }
  catch { return {}; }
}

/* ─── Constants ──────────────────────────────────────────── */
const STATUS_META = {
  PENDING:   { label: "Pending",    color: "#92400E", bg: "#FEF3C7", dot: "#F59E0B" },
  CONFIRMED: { label: "Confirmed",  color: "#065F46", bg: "#D1FAE5", dot: "#10B981" },
  REJECTED:  { label: "Rejected",   color: "#991B1B", bg: "#FEE2E2", dot: "#EF4444" },
  CANCELLED: { label: "Cancelled",  color: "#6B7280", bg: "#F3F4F6", dot: "#9CA3AF" },
  COMPLETED: { label: "Completed",  color: "#1E3A5F", bg: "#DBEAFE", dot: "#3B82F6" },
  IN_PROGRESS:{ label: "In Progress",color: "#5B21B6", bg: "#EDE9FE", dot: "#8B5CF6" },
  PAID:      { label: "Paid",       color: "#065F46", bg: "#D8F3DC", dot: "#22C55E" },
};

const CATEGORY_ICONS = {
  IT_SERVICES: "💻", PLUMBING: "🔧", ELECTRICAL: "⚡", CLEANING: "🧹",
  CARPENTRY: "🪵", PAINTING: "🎨", AC_REPAIR: "❄️", APPLIANCE_REPAIR: "🔩",
  PEST_CONTROL: "🪲", SALON: "💇", MASSAGE: "💆", TUTORING: "📚",
  PHOTOGRAPHY: "📷", CATERING: "🍽️", DRIVING: "🚗", OTHER: "🛠️",
};

const TAB_FILTERS = ["ALL", "PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "REJECTED"];

/* ─── Helpers ────────────────────────────────────────────── */
const fmt = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";
const fmtTime = (t) => t ? String(t).slice(0, 5) : "—";
const fmtCurrency = (n) => n != null ? `₹${Number(n).toLocaleString("en-IN")}` : "—";

function StatusBadge({ status }) {
  const m = STATUS_META[status] || { label: status, color: "#6B7280", bg: "#F3F4F6", dot: "#9CA3AF" };
  return (
    <span className="db-badge" style={{ background: m.bg, color: m.color }}>
      <span className="db-badge__dot" style={{ background: m.dot }} />
      {m.label}
    </span>
  );
}

/* ─── Stat Card ──────────────────────────────────────────── */
function StatCard({ icon, label, value, sub, accent, delay }) {
  return (
    <div className="db-stat" style={{ animationDelay: `${delay}s` }}>
      <div className="db-stat__icon" style={{ background: accent + "18", color: accent }}>{icon}</div>
      <div className="db-stat__body">
        <p className="db-stat__value">{value}</p>
        <p className="db-stat__label">{label}</p>
        {sub && <p className="db-stat__sub">{sub}</p>}
      </div>
    </div>
  );
}

/* ─── Action buttons for each booking ───────────────────── */
function BookingActions({ booking, onAction, loading }) {
  const s = booking.status;
  const busy = loading === booking.id;

  const btn = (label, action, variant = "ghost") => (
    <button
      key={action}
      className={`db-action-btn db-action-btn--${variant}`}
      onClick={() => onAction(booking.id, action)}
      disabled={!!loading}
    >
      {busy ? <span className="db-action-spinner" /> : label}
    </button>
  );

  if (s === "PENDING")     return <div className="db-actions">{btn("✓ Confirm", "confirm", "success")}{btn("✕ Reject", "reject", "danger")}</div>;
  if (s === "CONFIRMED")   return <div className="db-actions">{btn("▶ Start", "start", "primary")}</div>;
  if (s === "IN_PROGRESS") return <div className="db-actions">{btn("✓ Complete", "complete", "success")}</div>;
  if (s === "COMPLETED")   return <div className="db-actions">{btn("$ Mark Paid", "paid", "primary")}</div>;
  return null;
}

/* ─── Booking Row ────────────────────────────────────────── */
function BookingRow({ booking, onAction, loading, index }) {
  const [expanded, setExpanded] = useState(false);
  const icon = CATEGORY_ICONS[booking.serviceCategory] || "🛠️";

  return (
    <div className={`db-row ${expanded ? "db-row--open" : ""}`} style={{ animationDelay: `${index * 0.04}s` }}>
      <div className="db-row__main" onClick={() => setExpanded((v) => !v)}>
        <div className="db-row__icon">{icon}</div>
        <div className="db-row__info">
          <span className="db-row__cat">{(booking.serviceCategory || "SERVICE").replace(/_/g, " ")}</span>
          <span className="db-row__id">#{booking.id?.slice(-6).toUpperCase()}</span>
        </div>
        <div className="db-row__date">
          <span className="db-row__date-val">{fmt(booking.scheduledDate)}</span>
          <span className="db-row__time">{fmtTime(booking.scheduledTime)}</span>
        </div>
        <div className="db-row__price">{fmtCurrency(booking.basePrice)}</div>
        <StatusBadge status={booking.status} />
        <span className={`db-row__chevron ${expanded ? "db-row__chevron--open" : ""}`}>›</span>
      </div>

      {expanded && (
        <div className="db-row__detail">
          <div className="db-row__detail-grid">
            <div className="db-row__detail-item">
              <span className="db-row__detail-label">Customer ID</span>
              <span className="db-row__detail-val">{booking.customerId}</span>
            </div>
            <div className="db-row__detail-item">
              <span className="db-row__detail-label">Address</span>
              <span className="db-row__detail-val">{booking.address || "—"}</span>
            </div>
            <div className="db-row__detail-item">
              <span className="db-row__detail-label">Notes</span>
              <span className="db-row__detail-val">{booking.notes || "No notes"}</span>
            </div>
            <div className="db-row__detail-item">
              <span className="db-row__detail-label">Created</span>
              <span className="db-row__detail-val">{fmt(booking.createdAt)}</span>
            </div>
            {booking.cancellationReason && (
              <div className="db-row__detail-item db-row__detail-item--full">
                <span className="db-row__detail-label">Cancellation Reason</span>
                <span className="db-row__detail-val db-row__detail-val--warn">{booking.cancellationReason}</span>
              </div>
            )}
          </div>
          <BookingActions booking={booking} onAction={onAction} loading={loading} />
        </div>
      )}
    </div>
  );
}

/* ─── Main Dashboard ─────────────────────────────────────── */
export default function Dashboard() {
  const navigate = useNavigate();
  const user = getUser();
  const providerId = user.id;

  const [bookings,    setBookings]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error,       setError]       = useState("");
  const [activeTab,   setActiveTab]   = useState("ALL");
  const [search,      setSearch]      = useState("");

  /* ── Fetch ── */
  const fetchBookings = useCallback(() => {
    setLoading(true);
    axios.get("/booking/my", { headers: { "X-User-Id": providerId, "X-User-Role": "PROVIDER" } })
      .then((res) => setBookings(Array.isArray(res.data) ? res.data : []))
      .catch(() => setError("Failed to load bookings."))
      .finally(() => setLoading(false));
  }, [providerId]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  /* ── Action dispatcher ── */
  const handleAction = async (id, action) => {
    setActionLoading(id);
    try {
      const providerEmail = user.email || "";
      const endpoints = {
        confirm:  () => axios.patch(`/booking/${id}/confirm`,  {}, { headers: { "X-User-Email": providerEmail } }),
        reject:   () => axios.patch(`/booking/${id}/reject`,   {}, { headers: { "X-User-Email": providerEmail } }),
        start:    () => axios.patch(`/booking/${id}/start`),
        complete: () => axios.patch(`/booking/${id}/complete`),
        paid:     () => axios.patch(`/booking/${id}/paid`),
        cancel:   () => axios.patch(`/booking/${id}/cancel`, { reason: "Cancelled by provider" }, { headers: { "X-User-Role": "PROVIDER" } }),
      };
      const res = await endpoints[action]();
      setBookings((prev) => prev.map((b) => b.id === id ? res.data : b));
    } catch {
      setError(`Action "${action}" failed.`);
    } finally {
      setActionLoading(null);
    }
  };

  /* ── Derived stats ── */
  const stats = {
    total:      bookings.length,
    pending:    bookings.filter((b) => b.status === "PENDING").length,
    confirmed:  bookings.filter((b) => b.status === "CONFIRMED").length,
    completed:  bookings.filter((b) => b.status === "COMPLETED" || b.status === "PAID").length,
    revenue:    bookings.filter((b) => b.status === "PAID").reduce((s, b) => s + (b.basePrice || 0), 0),
    inProgress: bookings.filter((b) => b.status === "IN_PROGRESS").length,
  };

  /* ── Filter & search ── */
  const filtered = bookings
    .filter((b) => activeTab === "ALL" || b.status === activeTab)
    .filter((b) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        b.id?.toLowerCase().includes(q) ||
        b.serviceCategory?.toLowerCase().includes(q) ||
        b.address?.toLowerCase().includes(q) ||
        b.customerId?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const tabCount = (t) => t === "ALL" ? bookings.length : bookings.filter((b) => b.status === t).length;

  /* ── Greeting ── */
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <>
      <div className="db-page">
        <div className="db-inner">

          {/* ════ HEADER ════ */}
          <div className="db-header">
            <div className="db-header__left">
              <p className="db-header__greeting">{greeting} 👋</p>
              <h1 className="db-header__title">Provider Dashboard</h1>
              <p className="db-header__sub">Manage your bookings, track performance, and grow your business.</p>
            </div>
            <div className="db-header__actions">
              <button className="db-header__refresh" onClick={fetchBookings} disabled={loading} title="Refresh">
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
                </svg>
              </button>
              <button className="uc-btn uc-btn--primary" onClick={() => navigate("/profile")}>
                My Profile →
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="db-error">
              <span>⚠️ {error}</span>
              <button onClick={() => setError("")}>✕</button>
            </div>
          )}

          {/* ════ STATS GRID ════ */}
          <div className="db-stats-grid">
            <StatCard icon="📋" label="Total Bookings"  value={stats.total}     sub="All time"                accent="#1B4332" delay={0}    />
            <StatCard icon="🕐" label="Pending"         value={stats.pending}   sub="Awaiting your action"   accent="#F59E0B" delay={0.06} />
            <StatCard icon="⚡" label="In Progress"     value={stats.inProgress} sub="Currently active"      accent="#8B5CF6" delay={0.12} />
            <StatCard icon="✅" label="Completed"        value={stats.completed} sub="Successfully done"       accent="#10B981" delay={0.18} />
            <StatCard icon="💰" label="Revenue Earned"  value={fmtCurrency(stats.revenue)} sub="From paid bookings" accent="#FF6B35" delay={0.24} />
          </div>

          {/* ════ BOOKINGS PANEL ════ */}
          <div className="db-panel">

            {/* Panel header */}
            <div className="db-panel__head">
              <div className="db-panel__title-row">
                <h2 className="db-panel__title">Booking Requests</h2>
                <span className="db-panel__count">{filtered.length} showing</span>
              </div>

              {/* Search */}
              <div className="db-search-wrap">
                <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="db-search-icon">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  className="db-search"
                  placeholder="Search by ID, category, address…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button className="db-search-clear" onClick={() => setSearch("")}>✕</button>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="db-tabs">
              {TAB_FILTERS.map((t) => (
                <button
                  key={t}
                  className={`db-tab ${activeTab === t ? "db-tab--active" : ""}`}
                  onClick={() => setActiveTab(t)}
                >
                  {t === "ALL" ? "All" : t.replace("_", " ")}
                  <span className="db-tab__count">{tabCount(t)}</span>
                </button>
              ))}
            </div>

            {/* Table header */}
            <div className="db-table-head">
              <span>Service</span>
              <span>Scheduled</span>
              <span>Price</span>
              <span>Status</span>
              <span />
            </div>

            {/* Rows */}
            <div className="db-rows">
              {loading && (
                <div className="db-skeleton-list">
                  {[1,2,3,4,5].map((n) => (
                    <div key={n} className="db-skeleton-row">
                      <div className="db-skeleton-row__icon" />
                      <div className="db-skeleton-row__lines">
                        <div className="db-skel-line db-skel-line--60" />
                        <div className="db-skel-line db-skel-line--40" />
                      </div>
                      <div className="db-skel-line db-skel-line--80" style={{ marginLeft: "auto" }} />
                      <div className="db-skel-line db-skel-line--50" />
                    </div>
                  ))}
                </div>
              )}

              {!loading && filtered.length === 0 && (
                <div className="db-empty">
                  <div className="db-empty__icon">📭</div>
                  <p className="db-empty__title">No bookings found</p>
                  <p className="db-empty__sub">
                    {activeTab !== "ALL"
                      ? `No ${activeTab.toLowerCase()} bookings yet.`
                      : "Your booking requests will appear here."}
                  </p>
                  {activeTab !== "ALL" && (
                    <button className="uc-btn uc-btn--ghost" onClick={() => setActiveTab("ALL")}>
                      View All
                    </button>
                  )}
                </div>
              )}

              {!loading && filtered.map((b, i) => (
                <BookingRow
                  key={b.id}
                  booking={b}
                  index={i}
                  onAction={handleAction}
                  loading={actionLoading}
                />
              ))}
            </div>
          </div>

          {/* ════ QUICK TIPS ════ */}
          {!loading && bookings.length > 0 && (
            <div className="db-tips">
              <div className="db-tip">
                <span className="db-tip__icon">💡</span>
                <p>Confirm pending bookings quickly to improve your response rate.</p>
              </div>
              <div className="db-tip">
                <span className="db-tip__icon">⭐</span>
                <p>Mark jobs as completed after finishing to unlock customer reviews.</p>
              </div>
              <div className="db-tip">
                <span className="db-tip__icon">📍</span>
                <p>Keep your availability and location updated to attract nearby customers.</p>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}