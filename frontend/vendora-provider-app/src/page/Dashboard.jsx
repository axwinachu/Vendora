import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axios";
import "../styles/dashboard.css";
import OtpVerificationModal from "../components/OtpVerificationModal";

function getUser() {
  try { return JSON.parse(localStorage.getItem("user_profile") || "{}"); }
  catch { return {}; }
}

const STATUS_PIPELINE = [
  { key: "PENDING",         short: "Received"    },
  { key: "CONFIRMED",       short: "Confirmed"   },
  { key: "IN_PROGRESS",     short: "In Progress" },
  { key: "WAITING_FOR_OTP", short: "OTP"         },
  { key: "COMPLETED",       short: "Completed"   },
  { key: "PAID",            short: "Paid"        },
];

const STATUS_META = {
  PENDING:         { label: "Pending",      color: "#92400E", bg: "#FEF3C7", dot: "#F59E0B" },
  CONFIRMED:       { label: "Confirmed",    color: "#065F46", bg: "#D1FAE5", dot: "#10B981" },
  REJECTED:        { label: "Rejected",     color: "#991B1B", bg: "#FEE2E2", dot: "#EF4444" },
  CANCELED:        { label: "Cancelled",    color: "#6B7280", bg: "#F3F4F6", dot: "#9CA3AF" },
  COMPLETED:       { label: "Completed",    color: "#1E3A5F", bg: "#DBEAFE", dot: "#3B82F6" },
  IN_PROGRESS:     { label: "In Progress",  color: "#5B21B6", bg: "#EDE9FE", dot: "#8B5CF6" },
  WAITING_FOR_OTP: { label: "Awaiting OTP", color: "#92400E", bg: "#FFF7ED", dot: "#F97316" },
  PAID:            { label: "Paid",         color: "#065F46", bg: "#D8F3DC", dot: "#22C55E" },
};

const CATEGORY_ICONS = {
  IT_SERVICES:"💻",PLUMBING:"🔧",ELECTRICAL:"⚡",CLEANING:"🧹",
  CARPENTRY:"🪵",PAINTING:"🎨",AC_REPAIR:"❄️",APPLIANCE_REPAIR:"🔩",
  PEST_CONTROL:"🪲",SALON:"💇",MASSAGE:"💆",TUTORING:"📚",
  PHOTOGRAPHY:"📷",CATERING:"🍽️",DRIVING:"🚗",OTHER:"🛠️",
};

const TAB_FILTERS = ["ALL","PENDING","CONFIRMED","IN_PROGRESS","WAITING_FOR_OTP","COMPLETED","CANCELED","REJECTED"];
const fmt         = d => d ? new Date(d).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}) : "—";
const fmtTime     = t => t ? String(t).slice(0,5) : "—";
const fmtCurrency = n => n != null ? `₹${Number(n).toLocaleString("en-IN")}` : "—";

const ChevronRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);
const XIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const KeyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
  </svg>
);
const CheckIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const PlayIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
);
const CheckCircleIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);
const DollarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);
const RefreshIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
  </svg>
);
const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
);
const MapPinIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
const CalendarIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const ClockIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const UserIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const FileIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);
const AlertIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

function OrderProgressBar({ status }) {
  const terminal = ["REJECTED","CANCELED"];
  if (terminal.includes(status)) {
    const m = STATUS_META[status];
    return (
      <div className="db-progress db-progress--terminal">
        <div className="db-progress__terminal-icon" style={{ background: m.bg, color: m.color }}><XIcon /></div>
        <div>
          <p className="db-progress__terminal-title" style={{ color: m.color }}>{m.label}</p>
          <p className="db-progress__terminal-sub">This booking was {status.toLowerCase()}</p>
        </div>
      </div>
    );
  }
  const currentIdx = STATUS_PIPELINE.findIndex(s => s.key === status);
  return (
    <div className="db-progress">
      {STATUS_PIPELINE.map((step, idx) => {
        const isDone = idx < currentIdx;
        const isActive = idx === currentIdx;
        const isPending = idx > currentIdx;
        return (
          <div key={step.key} className="db-progress__step">
            <div className="db-progress__node-wrap">
              {idx > 0 && <div className={`db-progress__line ${isDone || isActive ? "db-progress__line--done":""}`} />}
              <div className={["db-progress__node", isDone?"db-progress__node--done":"", isActive?"db-progress__node--active":"", isPending?"db-progress__node--pending":""].join(" ")}>
                {isDone ? (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                ) : isActive ? <span className="db-progress__pulse"/> : <span className="db-progress__num">{idx+1}</span>}
              </div>
              {idx < STATUS_PIPELINE.length-1 && <div className={`db-progress__line ${isDone?"db-progress__line--done":""}`} />}
            </div>
            <span className={["db-progress__label", isActive?"db-progress__label--active":"", isDone?"db-progress__label--done":""].join(" ")}>{step.short}</span>
          </div>
        );
      })}
    </div>
  );
}

function StatusBadge({ status }) {
  const m = STATUS_META[status] || { label: status, color: "#6B7280", bg: "#F3F4F6", dot: "#9CA3AF" };
  return (
    <span className="db-badge" style={{ background: m.bg, color: m.color }}>
      <span className="db-badge__dot" style={{ background: m.dot }} />{m.label}
    </span>
  );
}

function StatCard({ icon, label, value, sub, accent, delay }) {
  return (
    <div className="db-stat" style={{ animationDelay:`${delay}s` }}>
      <div className="db-stat__icon" style={{ background: accent+"18", color: accent }}>{icon}</div>
      <div className="db-stat__body">
        <p className="db-stat__value">{value}</p>
        <p className="db-stat__label">{label}</p>
        {sub && <p className="db-stat__sub">{sub}</p>}
      </div>
    </div>
  );
}

function BookingActions({ booking, onAction, loading, onOpenOtp }) {
  const s    = booking.status;
  const busy = loading === booking.id;

  const Btn = ({ label, icon, action, variant }) => (
    <button className={`db-action-btn db-action-btn--${variant}`}
      onClick={e => { e.stopPropagation(); onAction(booking.id, action); }}
      disabled={!!loading} title={label}>
      {busy ? <span className="db-action-spinner"/> : <><span className="db-action-btn__icon">{icon}</span><span className="db-action-btn__label">{label}</span></>}
    </button>
  );

  if (s === "PENDING") return <div className="db-actions"><Btn label="Confirm Booking" icon={<CheckIcon/>} action="confirm" variant="success"/><Btn label="Reject" icon={<XIcon/>} action="reject" variant="danger"/></div>;
  if (s === "CONFIRMED") return <div className="db-actions"><Btn label="Start Job" icon={<PlayIcon/>} action="start" variant="primary"/></div>;
  if (s === "IN_PROGRESS") return <div className="db-actions"><Btn label="Mark Complete" icon={<CheckCircleIcon/>} action="complete" variant="success"/></div>;
  if (s === "COMPLETED") return <div className="db-actions"><Btn label="Mark as Paid" icon={<DollarIcon/>} action="paid" variant="primary"/></div>;

  if (s === "WAITING_FOR_OTP") return (
    <div className="db-actions">
      <button className="db-action-btn db-action-btn--otp" onClick={e => { e.stopPropagation(); onOpenOtp(); }} disabled={!!loading}>
        <span className="db-action-btn__icon"><KeyIcon/></span>
        <span className="db-action-btn__label">Enter OTP</span>
        <span className="db-otp-pulse"/>
      </button>
    </div>
  );
  return null;
}

function BookingRow({ booking, onAction, loading, index, onBookingUpdated }) {
  const [expanded, setExpanded] = useState(false);
  const [showOtp,  setShowOtp]  = useState(false);
  const icon = CATEGORY_ICONS[booking.serviceCategory] || "🛠️";

  return (
    <>
      <div className={`db-row ${expanded?"db-row--open":""}`} style={{ animationDelay:`${index*0.04}s` }}>
        <div className="db-row__main" onClick={() => setExpanded(v=>!v)}>
          <div className="db-row__icon-cell">
            <div className="db-row__icon">{icon}</div>
            <div className="db-row__info">
              <span className="db-row__cat">{(booking.serviceCategory||"SERVICE").replace(/_/g," ")}</span>
              <span className="db-row__id">#{booking.id?.slice(-6).toUpperCase()}</span>
            </div>
          </div>
          <div className="db-row__meta">
            <span className="db-row__meta-item"><CalendarIcon/>{fmt(booking.scheduledDate)}</span>
            <span className="db-row__meta-item db-row__meta-item--sub"><ClockIcon/>{fmtTime(booking.scheduledTime)}</span>
          </div>
          <div className="db-row__price">{fmtCurrency(booking.basePrice)}</div>
          <StatusBadge status={booking.status}/>
          <span className={`db-row__chevron ${expanded?"db-row__chevron--open":""}`}><ChevronRightIcon/></span>
        </div>

        {expanded && (
          <div className="db-row__detail">
            <div className="db-row__progress-wrap">
              <p className="db-row__progress-title">Booking Status</p>
              <OrderProgressBar status={booking.status}/>
            </div>

            {booking.status === "WAITING_FOR_OTP" && (
              <div className="db-otp-banner">
                <span className="db-otp-banner__icon"><KeyIcon/></span>
                <div>
                  <p className="db-otp-banner__title">Awaiting OTP verification</p>
                  <p className="db-otp-banner__sub">A 6-digit OTP was sent to the customer. Ask them to share it to complete the job.</p>
                </div>
              </div>
            )}

            <div className="db-row__detail-grid">
              <div className="db-row__detail-item">
                <span className="db-row__detail-label"><UserIcon/> Customer ID</span>
                <span className="db-row__detail-val">{booking.customerId}</span>
              </div>
              <div className="db-row__detail-item">
                <span className="db-row__detail-label"><MapPinIcon/> Address</span>
                <span className="db-row__detail-val">{booking.address||"—"}</span>
              </div>
              <div className="db-row__detail-item">
                <span className="db-row__detail-label"><FileIcon/> Notes</span>
                <span className="db-row__detail-val">{booking.notes||"No notes"}</span>
              </div>
              <div className="db-row__detail-item">
                <span className="db-row__detail-label"><CalendarIcon/> Created</span>
                <span className="db-row__detail-val">{fmt(booking.createdAt)}</span>
              </div>
              {booking.cancellationReason && (
                <div className="db-row__detail-item db-row__detail-item--full">
                  <span className="db-row__detail-label"><AlertIcon/> Cancellation Reason</span>
                  <span className="db-row__detail-val db-row__detail-val--warn">{booking.cancellationReason}</span>
                </div>
              )}
            </div>

            <BookingActions booking={booking} onAction={onAction} loading={loading} onOpenOtp={() => setShowOtp(true)}/>
          </div>
        )}
      </div>

      {showOtp && (
        <OtpVerificationModal
          bookingId={booking.id}
          onSuccess={updated => { setShowOtp(false); setExpanded(false); onBookingUpdated(updated); }}
          onClose={() => setShowOtp(false)}
        />
      )}
    </>
  );
}

export default function Dashboard() {
  const navigate   = useNavigate();
  const user       = getUser();
  const providerId = user.id;

  const [bookings,      setBookings]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error,         setError]         = useState("");
  const [activeTab,     setActiveTab]     = useState("ALL");
  const [search,        setSearch]        = useState("");

  const fetchBookings = useCallback(() => {
    setLoading(true);
    axios.get("/booking/my", { headers: { "X-User-Id": providerId, "X-User-Role": "PROVIDER" } })
      .then(res => setBookings(Array.isArray(res.data) ? res.data : []))
      .catch(() => setError("Failed to load bookings."))
      .finally(() => setLoading(false));
  }, [providerId]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const handleAction = async (id, action) => {
    setActionLoading(id);
    try {
      const email = user.email || "";
      const map = {
        confirm:  () => axios.patch(`/booking/${id}/confirm`,  {}, { headers: { "X-User-Email": email } }),
        reject:   () => axios.patch(`/booking/${id}/reject`,   {}, { headers: { "X-User-Email": email } }),
        start:    () => axios.patch(`/booking/${id}/start`),
        complete: () => axios.patch(`/booking/${id}/complete`),
        paid:     () => axios.put(`/booking/${id}/paid`),
        cancel:   () => axios.patch(`/booking/${id}/cancel`, { reason: "Cancelled by provider" }, { headers: { "X-User-Role": "PROVIDER" } }),
      };
      const res = await map[action]();
      setBookings(prev => prev.map(b => b.id === id ? res.data : b));
    } catch { setError(`Action "${action}" failed.`); }
    finally  { setActionLoading(null); }
  };

  const stats = {
    total:      bookings.length,
    pending:    bookings.filter(b => b.status === "PENDING").length,
    inProgress: bookings.filter(b => ["IN_PROGRESS","WAITING_FOR_OTP"].includes(b.status)).length,
    completed:  bookings.filter(b => ["COMPLETED","PAID"].includes(b.status)).length,
    revenue:    bookings.filter(b => b.status === "PAID").reduce((s,b) => s+(b.basePrice||0), 0),
  };

  const filtered = bookings
    .filter(b => activeTab === "ALL" || b.status === activeTab)
    .filter(b => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return b.id?.toLowerCase().includes(q) || b.serviceCategory?.toLowerCase().includes(q) ||
             b.address?.toLowerCase().includes(q) || b.customerId?.toLowerCase().includes(q);
    })
    .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

  const tabCount = t => t === "ALL" ? bookings.length : bookings.filter(b => b.status === t).length;
  const hour     = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="db-page">
      <div className="db-inner">

        <div className="db-header">
          <div className="db-header__left">
            <p className="db-header__greeting">{greeting} 👋</p>
            <h1 className="db-header__title">Provider Dashboard</h1>
            <p className="db-header__sub">Manage bookings, track performance, and grow your business.</p>
          </div>
          <div className="db-header__actions">
            <button className="db-header__refresh" onClick={fetchBookings} disabled={loading} title="Refresh"><RefreshIcon/></button>
            <button className="uc-btn uc-btn--primary" onClick={() => navigate("/profile")}>My Profile →</button>
          </div>
        </div>

        {error && (
          <div className="db-error">
            <span>⚠️ {error}</span>
            <button onClick={() => setError("")}><XIcon/></button>
          </div>
        )}

        <div className="db-stats-grid">
          <StatCard icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>} label="Total Bookings" value={stats.total} sub="All time" accent="#1B4332" delay={0}/>
          <StatCard icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 22h14M5 2h14M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/></svg>} label="Pending" value={stats.pending} sub="Awaiting your action" accent="#F59E0B" delay={0.06}/>
          <StatCard icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>} label="In Progress" value={stats.inProgress} sub="Currently active" accent="#8B5CF6" delay={0.12}/>
          <StatCard icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>} label="Completed" value={stats.completed} sub="Successfully done" accent="#10B981" delay={0.18}/>
          <StatCard icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12M6 8h12M6 13l8.5 8L18 13M6 13a5 5 0 0 0 0-10"/></svg>} label="Revenue" value={fmtCurrency(stats.revenue)} sub="From paid bookings" accent="#FF6B35" delay={0.24}/>
        </div>

        <div className="db-panel">
          <div className="db-panel__head">
            <div className="db-panel__title-row">
              <h2 className="db-panel__title">Booking Requests</h2>
              <span className="db-panel__count">{filtered.length} showing</span>
            </div>
            <div className="db-search-wrap">
              <SearchIcon/>
              <input className="db-search" placeholder="Search by ID, category, address…" value={search} onChange={e => setSearch(e.target.value)}/>
              {search && <button className="db-search-clear" onClick={() => setSearch("")}><XIcon/></button>}
            </div>
          </div>

          <div className="db-tabs">
            {TAB_FILTERS.map(t => (
              <button key={t} className={`db-tab ${activeTab===t?"db-tab--active":""}`} onClick={() => setActiveTab(t)}>
                {t === "ALL" ? "All" : t.replace(/_/g," ")}
                {t === "WAITING_FOR_OTP" && tabCount(t) > 0 && <span className="db-tab__alert"/>}
                <span className="db-tab__count">{tabCount(t)}</span>
              </button>
            ))}
          </div>

          <div className="db-table-head">
            <span>Service</span><span>Scheduled</span><span>Price</span><span>Status</span><span/>
          </div>

          <div className="db-rows">
            {loading && (
              <div className="db-skeleton-list">
                {[1,2,3,4,5].map(n => (
                  <div key={n} className="db-skeleton-row">
                    <div className="db-skeleton-row__icon"/>
                    <div className="db-skeleton-row__lines">
                      <div className="db-skel-line db-skel-line--60"/>
                      <div className="db-skel-line db-skel-line--40"/>
                    </div>
                    <div className="db-skel-line db-skel-line--80" style={{marginLeft:"auto"}}/>
                    <div className="db-skel-line db-skel-line--50"/>
                  </div>
                ))}
              </div>
            )}

            {!loading && filtered.length === 0 && (
              <div className="db-empty">
                <div className="db-empty__icon">📭</div>
                <p className="db-empty__title">No bookings found</p>
                <p className="db-empty__sub">{activeTab!=="ALL"?`No ${activeTab.replace(/_/g," ").toLowerCase()} bookings yet.`:"Your booking requests will appear here."}</p>
                {activeTab!=="ALL" && <button className="db-action-btn db-action-btn--ghost" onClick={() => setActiveTab("ALL")}>View All</button>}
              </div>
            )}

            {!loading && filtered.map((b,i) => (
              <BookingRow key={b.id} booking={b} index={i} onAction={handleAction} loading={actionLoading}
                onBookingUpdated={updated => setBookings(prev => prev.map(x => x.id===updated.id?updated:x))}/>
            ))}
          </div>
        </div>

        {!loading && bookings.length > 0 && (
          <div className="db-tips">
            <div className="db-tip"><span className="db-tip__icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg></span><p>Confirm pending bookings quickly to improve your response rate.</p></div>
            <div className="db-tip"><span className="db-tip__icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></span><p>Verify OTP on-site to mark jobs as completed instantly.</p></div>
            <div className="db-tip"><span className="db-tip__icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></span><p>Keep your availability updated to attract nearby customers.</p></div>
          </div>
        )}

      </div>
    </div>
  );
}