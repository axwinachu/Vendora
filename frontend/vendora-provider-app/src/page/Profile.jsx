import { useEffect, useState } from "react";
import { getProviderProfile } from "../api/providerApi";
import axios from "../api/axios";
import "../styles/profile.css";

/* ─── Constants ──────────────────────────────────────────── */
const DISTRICTS = ["PALAKKAD", "COIMBATORE"];

const SERVICE_CATEGORIES = [
  "ELECTRICAL",
  "MECHANICAL",
  "DIGITAL_MARKETING",
  "IT_SERVICES",
  "PHOTOGRAPHY",
  "SALE_MARKETING",
  "TUTORING",
  "OTHERS",
];

const CATEGORY_ICONS = {
  ELECTRICAL:       "⚡",
  MECHANICAL:       "🔧",
  DIGITAL_MARKETING:"📈",
  IT_SERVICES:      "💻",
  PHOTOGRAPHY:      "📷",
  SALE_MARKETING:   "🛒",
  TUTORING:         "📚",
  OTHERS:           "🛠️",
};

const STATUS_COLORS = {
  PENDING:  { bg: "#FEF9C3", color: "#92400E", label: "Pending Review" },
  APPROVED: { bg: "#D8F3DC", color: "#1B4332", label: "Approved"       },
  SUSPEND:  { bg: "#FEE2E2", color: "#991B1B", label: "Suspended"      },
  REJECTED: { bg: "#F3F4F6", color: "#6B7280", label: "Rejected"       },
};

const PROFILE_FIELDS = [
  { label: "Business Name", key: "businessName" },
  { label: "Description",   key: "description"  },
  { label: "Category",      key: "serviceCategory", type: "select", options: SERVICE_CATEGORIES },
  { label: "District",      key: "district",         type: "select", options: DISTRICTS         },
  { label: "Address",       key: "address"      },
  { label: "Price Unit",    key: "priceUnit"    },
];

const LOCAL_KEY = "provider_profile";
const loadLocal = () => { try { return JSON.parse(localStorage.getItem(LOCAL_KEY)); } catch { return null; } };
const saveLocal = (d) => localStorage.setItem(LOCAL_KEY, JSON.stringify(d));

/* ─── FieldRow (identical pattern to Profile.jsx) ─────────── */
function FieldRow({ label, fieldKey, value, type, options, editingField, editValue, setEditValue, onStartEdit, onSave, onCancel }) {
  const isEditing = editingField === fieldKey;

  const renderInput = () => {
    if (type === "select") {
      return (
        <select className="pr-field__select" value={editValue} onChange={(e) => setEditValue(e.target.value)}>
          <option value="">Select {label}</option>
          {options.map((o) => (
            <option key={o} value={o}>{o.replace(/_/g, " ")}</option>
          ))}
        </select>
      );
    }
    if (fieldKey === "description") {
      return (
        <textarea
          className="pr-field__input pr-field__textarea"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          placeholder={`Enter ${label.toLowerCase()}`}
          rows={3}
        />
      );
    }
    return (
      <input
        className="pr-field__input"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        placeholder={`Enter ${label.toLowerCase()}`}
      />
    );
  };

  const displayValue = value
    ? String(value).replace(/_/g, " ")
    : null;

  return (
    <div className="pr-field">
      <span className="pr-field__label">{label}</span>
      {isEditing ? (
        <div className="pr-field__edit">
          {renderInput()}
          <button className="pr-field__save-btn"   onClick={onSave}>✓</button>
          <button className="pr-field__cancel-btn" onClick={onCancel}>✕</button>
        </div>
      ) : (
        <div className="pr-field__display">
          <span className="pr-field__value">
            {displayValue || <span className="pr-field__not-set">Not set</span>}
          </span>
          <button className="pr-field__edit-btn" onClick={() => onStartEdit(fieldKey, value)}>
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── NumericFieldRow ─────────────────────────────────────── */
function NumericFieldRow({ label, fieldKey, value, prefix, editingField, editValue, setEditValue, onStartEdit, onSave, onCancel }) {
  const isEditing = editingField === fieldKey;
  return (
    <div className="pr-field">
      <span className="pr-field__label">{label}</span>
      {isEditing ? (
        <div className="pr-field__edit">
          <input
            type="number"
            className="pr-field__input"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder={`Enter ${label.toLowerCase()}`}
            min="0"
          />
          <button className="pr-field__save-btn"   onClick={onSave}>✓</button>
          <button className="pr-field__cancel-btn" onClick={onCancel}>✕</button>
        </div>
      ) : (
        <div className="pr-field__display">
          <span className="pr-field__value">
            {value != null
              ? `${prefix || ""}${Number(value).toLocaleString("en-IN")}`
              : <span className="pr-field__not-set">Not set</span>}
          </span>
          <button className="pr-field__edit-btn" onClick={() => onStartEdit(fieldKey, value ?? "")}>
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── StarRating ─────────────────────────────────────────── */
function StarRating({ rating = 0 }) {
  return (
    <span className="pvp-stars">
      {[1,2,3,4,5].map((s) => (
        <svg key={s} width={14} height={14} viewBox="0 0 24 24"
          fill={s <= Math.round(rating) ? "#F59E0B" : "#E5E7EB"}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
    </span>
  );
}

/* ─── PortfolioGrid ──────────────────────────────────────── */
function PortfolioGrid({ images, onRemove, onUpload, uploading }) {
  return (
    <div className="pvp-portfolio">
      <div className="pvp-portfolio__grid">
        {images.map((url, i) => (
          <div key={i} className="pvp-portfolio__item">
            <img src={url} alt={`Portfolio ${i + 1}`} className="pvp-portfolio__img" />
            <button className="pvp-portfolio__remove" onClick={() => onRemove(url)} title="Remove">✕</button>
          </div>
        ))}
        {images.length < 10 && (
          <label className="pvp-portfolio__add">
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            <span>{uploading ? "Uploading…" : "Add Photo"}</span>
            <input type="file" accept="image/*" onChange={onUpload} disabled={uploading} />
          </label>
        )}
      </div>
      <p className="pvp-portfolio__hint">{images.length}/10 portfolio images</p>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────── */
const Profile = () => {
  const [provider,        setProvider]        = useState(null);
  const [editingField,    setEditingField]    = useState(null);
  const [editValue,       setEditValue]       = useState("");
  const [preview,         setPreview]         = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState("");
  const [photoUploading,  setPhotoUploading]  = useState(false);
  const [photoInputKey,   setPhotoInputKey]   = useState(0);
  const [portUploading,   setPortUploading]   = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [availToggling,   setAvailToggling]   = useState(false);

  /* ── Load ── */
  useEffect(() => {
    getProviderProfile()
      .then((res) => { setProvider(res.data); saveLocal(res.data); })
      .catch(() => {
        const local = loadLocal();
        if (local) setProvider(local);
        else setError("Failed to load provider profile.");
      })
      .finally(() => setLoading(false));
  }, []);

  /* ── Field edit helpers ── */
  const startEdit  = (field, current) => { setEditingField(field); setEditValue(current ?? ""); };
  const cancelEdit = () => { setEditingField(null); setEditValue(""); };

  const saveField = async () => {
    const field = editingField;
    const val   = editValue;
    cancelEdit();
    try {
      const res = await axios.put(`provider/${provider.userId}`, { [field]: val });
      setProvider(res.data); saveLocal(res.data);
    } catch {
      const optimistic = { ...provider, [field]: val };
      setProvider(optimistic); saveLocal(optimistic);
    }
    setError("");
  };

  /* ── Profile photo ── */
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setPhotoUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await axios.post(`provider/${provider.userId}/photo`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProvider(res.data); saveLocal(res.data); setPreview(null);
    } catch { setError("Photo upload failed."); setPreview(null); }
    finally  { setPhotoUploading(false); setPhotoInputKey((k) => k + 1); }
  };

  /* ── Remove profile photo ── */
  const handleRemovePhoto = async () => {
    try {
      const res = await axios.delete(`provider/${provider.userId}/photo`);
      setProvider(res.data); saveLocal(res.data); setPreview(null);
    } catch { setError("Could not remove photo."); }
  };

  /* ── Portfolio ── */
  const portfolioImages = provider?.portfolioImages
    ? (Array.isArray(provider.portfolioImages)
        ? provider.portfolioImages
        : provider.portfolioImages.split(",").filter(Boolean))
    : [];

  const handlePortfolioUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPortUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await axios.post(`provider/${provider.userId}/portfolio`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProvider(res.data); saveLocal(res.data);
    } catch (err) {
      setError(err?.response?.data?.message || "Portfolio upload failed.");
    } finally { setPortUploading(false); }
  };

  const handlePortfolioRemove = async (imageUrl) => {
    try {
      const res = await axios.delete(`provider/${provider.userId}/portfolio`, { params: { imageUrl } });
      setProvider(res.data); saveLocal(res.data);
    } catch { setError("Could not remove image."); }
  };

  /* ── Location ── */
  const updateLocation = () => {
    if (!navigator.geolocation) { setError("Geolocation not supported."); return; }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await axios.put(`provider/${provider.userId}`, {
            latitude:  pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
          setProvider(res.data); saveLocal(res.data); setError("");
        } catch { setError("Could not update location."); }
        finally  { setLocationLoading(false); }
      },
      () => { setError("Location access denied."); setLocationLoading(false); }
    );
  };

  /* ── Toggle availability ── */
  const toggleAvailability = async () => {
    setAvailToggling(true);
    try {
      const res = await axios.patch(`provider/${provider.userId}/availability`);
      setProvider(res.data); saveLocal(res.data);
    } catch { setError("Could not update availability."); }
    finally  { setAvailToggling(false); }
  };

  /* ── Loading screen ── */
  if (loading) {
    return (
      <div className="pr-loading">
        <div className="pr-spinner" />
        <p className="pr-loading-text">Loading your provider profile…</p>
      </div>
    );
  }

  const avatarSrc  = preview || provider?.profilePhotoUrl;
  const catIcon    = CATEGORY_ICONS[provider?.serviceCategory] || "🛠️";
  const statusMeta = STATUS_COLORS[provider?.status] || STATUS_COLORS.PENDING;
  const initials   = provider?.businessName?.charAt(0)?.toUpperCase() || "P";

  const STATS = [
    { icon: "⭐", label: "Avg Rating",   value: provider?.averageRating ? provider.averageRating.toFixed(1) : "New" },
    { icon: "📋", label: "Total Bookings", value: provider?.totalBookings ?? 0 },
    { icon: "💬", label: "Reviews",      value: provider?.totalReviews ?? 0   },
    { icon: "🏆", label: "Experience",   value: provider?.experienceYears ? `${provider.experienceYears} yrs` : "—" },
  ];

  return (
    <>
      <div className="pr-page">
        <div className="pr-inner">

          {/* ════ MAIN LAYOUT ════ */}
          <div className="pr-layout">

            {/* ── LEFT: Profile Card ── */}
            <div className="pr-card">

              {/* Header strip */}
              <div className="pr-card__header">
                <div>
                  <p className="pr-card__header-eyebrow">Provider</p>
                  <h1 className="pr-card__header-title">My Business Profile</h1>
                </div>
                <div className="pr-card__header-dots">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="pr-card__header-dot" />
                  ))}
                </div>
              </div>

              {/* Avatar + business info */}
              <div className="pr-avatar-section">
                <div className="pvp-photo-wrap">
                  {/* Avatar image or placeholder */}
                  {avatarSrc ? (
                    <img className="pr-avatar pvp-photo-img" src={avatarSrc} alt="Business" />
                  ) : (
                    <div className="pr-avatar-placeholder pvp-photo-img">{catIcon}</div>
                  )}

                  {/* Hover overlay with upload / remove */}
                  <div className={`pvp-photo-overlay ${photoUploading ? "pvp-photo-overlay--loading" : ""}`}>
                    {photoUploading ? (
                      <div className="pvp-photo-spinner" />
                    ) : (
                      <>
                        <label className="pvp-photo-action" title="Upload new photo">
                          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                            <circle cx="12" cy="13" r="4"/>
                          </svg>
                          <span>Change</span>
                          <input
                            key={photoInputKey}
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                          />
                        </label>
                        {avatarSrc && (
                          <button className="pvp-photo-action pvp-photo-action--remove" onClick={handleRemovePhoto} title="Remove photo">
                            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                            </svg>
                            <span>Remove</span>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="pr-avatar-info">
                  <p className="pr-avatar-name">{provider?.businessName || "Your Business"}</p>
                  <p className="pr-avatar-email">{provider?.email}</p>
                  <div className="pvp-avatar-badges">
                    {provider?.district && (
                      <span className="pr-avatar-district">
                        <svg width={11} height={11} viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                        </svg>
                        {provider.district.charAt(0) + provider.district.slice(1).toLowerCase()}
                      </span>
                    )}
                    <span className="pvp-status-badge" style={{ background: statusMeta.bg, color: statusMeta.color }}>
                      {statusMeta.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Error */}
              {error && <div className="pr-error">{error}</div>}

              {/* ── Business Details ── */}
              <div className="pr-section-divider">
                <div className="pr-section-divider__line" />
                <span className="pr-section-divider__label">Business Details</span>
                <div className="pr-section-divider__line" />
              </div>

              <div className="pr-fields">
                {PROFILE_FIELDS.map((f) => (
                  <FieldRow
                    key={f.key}
                    label={f.label}
                    fieldKey={f.key}
                    type={f.type}
                    options={f.options}
                    value={provider?.[f.key]}
                    editingField={editingField}
                    editValue={editValue}
                    setEditValue={setEditValue}
                    onStartEdit={startEdit}
                    onSave={saveField}
                    onCancel={cancelEdit}
                  />
                ))}
              </div>

              {/* ── Pricing ── */}
              <div className="pr-section-divider">
                <div className="pr-section-divider__line" />
                <span className="pr-section-divider__label">Pricing & Experience</span>
                <div className="pr-section-divider__line" />
              </div>

              <div className="pr-fields">
                <NumericFieldRow
                  label="Base Price"
                  fieldKey="basePrice"
                  value={provider?.basePrice}
                  prefix="₹"
                  editingField={editingField}
                  editValue={editValue}
                  setEditValue={setEditValue}
                  onStartEdit={startEdit}
                  onSave={saveField}
                  onCancel={cancelEdit}
                />
                <NumericFieldRow
                  label="Experience (yrs)"
                  fieldKey="experienceYears"
                  value={provider?.experienceYears}
                  editingField={editingField}
                  editValue={editValue}
                  setEditValue={setEditValue}
                  onStartEdit={startEdit}
                  onSave={saveField}
                  onCancel={cancelEdit}
                />

                {/* Email — read-only */}
                <div className="pr-field">
                  <span className="pr-field__label">Email</span>
                  <div className="pr-field__display">
                    <span className="pr-field__value">{provider?.email}</span>
                    <span className="pr-field__verified">
                      <svg width={10} height={10} viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                      </svg>
                      Verified
                    </span>
                  </div>
                </div>
              </div>

              {/* ── Availability ── */}
              <div className="pr-section-divider">
                <div className="pr-section-divider__line" />
                <span className="pr-section-divider__label">Availability</span>
                <div className="pr-section-divider__line" />
              </div>

              <div className="pvp-avail-row">
                <div className="pvp-avail-info">
                  <div className={`pvp-avail-dot ${provider?.isAvailable ? "pvp-avail-dot--on" : "pvp-avail-dot--off"}`} />
                  <div>
                    <p className="pvp-avail-title">{provider?.isAvailable ? "Currently Available" : "Currently Unavailable"}</p>
                    <p className="pvp-avail-sub">Customers {provider?.isAvailable ? "can" : "cannot"} book your services</p>
                  </div>
                </div>
                <button
                  className={`pvp-avail-toggle ${provider?.isAvailable ? "pvp-avail-toggle--on" : ""}`}
                  onClick={toggleAvailability}
                  disabled={availToggling}
                >
                  <span className="pvp-avail-toggle__knob" />
                </button>
              </div>

              {/* ── Location ── */}
              <div className="pr-section-divider">
                <div className="pr-section-divider__line" />
                <span className="pr-section-divider__label">Location</span>
                <div className="pr-section-divider__line" />
              </div>

              <div className="pr-location">
                <div className="pr-location__info">
                  <div className="pr-location__icon">
                    <svg width={18} height={18} viewBox="0 0 24 24" fill="#52B788">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="pr-location__title">Service Coordinates</p>
                    <p className="pr-location__coords">
                      {provider?.latitude && provider?.longitude
                        ? `${provider.latitude.toFixed(5)}° N,  ${provider.longitude.toFixed(5)}° E`
                        : "Location not set yet"}
                    </p>
                  </div>
                </div>
                <button className="pr-location__btn" onClick={updateLocation} disabled={locationLoading}>
                  {locationLoading ? (
                    <><div className="pr-location__btn-spinner" />Updating…</>
                  ) : (
                    <><svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
                    </svg>Update Location</>
                  )}
                </button>
              </div>

              {/* ── Portfolio ── */}
              <div className="pr-section-divider">
                <div className="pr-section-divider__line" />
                <span className="pr-section-divider__label">Portfolio</span>
                <div className="pr-section-divider__line" />
              </div>

              <div style={{ padding: "12px 24px 24px" }}>
                <PortfolioGrid
                  images={portfolioImages}
                  onRemove={handlePortfolioRemove}
                  onUpload={handlePortfolioUpload}
                  uploading={portUploading}
                />
              </div>

              {/* Card footer */}
              <div className="pr-card__footer">
                <p className="pr-card__footer-note">🔒 Your business data is securely stored.</p>
              </div>
            </div>

            {/* ── RIGHT: Sidebar ── */}
            <aside className="pr-sidebar">

              {/* Stats */}
              <div className="pr-stats">
                <div className="pr-stats__header">
                  <p className="pr-stats__title">Performance</p>
                </div>
                <div className="pr-stats__list">
                  {STATS.map((s) => (
                    <div key={s.label} className="pr-stat">
                      <div className="pr-stat__icon">{s.icon}</div>
                      <div className="pr-stat__info">
                        <p className="pr-stat__label">{s.label}</p>
                        <p className="pr-stat__value">{s.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rating preview */}
              <div className="pr-security pvp-rating-card">
                <p className="pr-security__title">Rating Overview</p>
                <div className="pvp-rating-display">
                  <span className="pvp-rating-big">
                    {provider?.averageRating ? provider.averageRating.toFixed(1) : "—"}
                  </span>
                  <div>
                    <StarRating rating={provider?.averageRating || 0} />
                    <p className="pvp-rating-sub">{provider?.totalReviews ?? 0} reviews</p>
                  </div>
                </div>
              </div>

              {/* Account status */}
              <div className="pr-security">
                <p className="pr-security__title">Account Status</p>
                <div className="pr-security__items">
                  <div className="pr-security__item">
                    <span className="pr-security__dot" />
                    Profile {provider?.status === "APPROVED" ? "verified & live" : "under review"}
                  </div>
                  <div className="pr-security__item">
                    <span className="pr-security__dot" />
                    {portfolioImages.length} portfolio image{portfolioImages.length !== 1 ? "s" : ""}
                  </div>
                  <div className="pr-security__item">
                    <span className="pr-security__dot" />
                    {provider?.serviceCategory?.replace(/_/g, " ") || "Category not set"}
                  </div>
                </div>
              </div>

              {/* Tips card */}
              <div className="pr-cta-card">
                <p className="pr-cta-card__title">Boost Your Visibility</p>
                <p className="pr-cta-card__sub">
                  Complete your profile, add portfolio photos, and keep availability updated to get more bookings.
                </p>
                <button className="pr-cta-card__btn">
                  View Tips →
                </button>
              </div>

            </aside>
          </div>
        </div>
      </div>
      
    </>
  );
};

export default Profile;