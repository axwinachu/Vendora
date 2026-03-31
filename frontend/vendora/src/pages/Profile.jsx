import { useEffect, useState } from "react";
import {
  getCurrentUser,
  updateUser,
  uploadProfileImage,
} from "../api/userApi";
import axios from "../api/axios";
import keycloak from "../keycloak.js";
import "../styles/Profile.css";
import Navbar from "../components/Navbar.jsx"
import Footer from "../components/Footer.jsx";

const DISTRICTS = ["PALAKAD", "COIMBATORE"];

const PROFILE_FIELDS = [
  { label: "Full Name", key: "userName"  },
  { label: "Phone",     key: "phone"     },
  { label: "District",  key: "district"  },
];

const STATS = [
  { icon: "⭐", label: "Rating",    value: "4.9" },
  { icon: "✅", label: "Jobs Done", value: "128" },
  { icon: "🏅", label: "Badge",     value: "Pro" },
];

const SECURITY_ITEMS = [
  "Two-factor authentication ready",
  "End-to-end encrypted data",
  "GDPR compliant storage",
];

/* ─── Local storage helpers ──────────────────────────────── */
const loadLocalUser = () => {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY)); }
  catch { return null; }
};
const saveLocalUser = (data) =>
  localStorage.setItem(LOCAL_KEY, JSON.stringify(data));

/* ─── FieldRow ───────────────────────────────────────────── */
function FieldRow({ label, fieldKey, value, editingField, editValue, setEditValue, onStartEdit, onSave, onCancel }) {
  const isEditing = editingField === fieldKey;

  return (
    <div className="pr-field">
      <span className="pr-field__label">{label}</span>

      {isEditing ? (
        <div className="pr-field__edit">
          {fieldKey === "district" ? (
            <select
              className="pr-field__select"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
            >
              <option value="">Select District</option>
              {DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d.charAt(0) + d.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          ) : (
            <input
              className="pr-field__input"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder={`Enter ${label.toLowerCase()}`}
            />
          )}
          <button className="pr-field__save-btn"   onClick={onSave}>✓</button>
          <button className="pr-field__cancel-btn" onClick={onCancel}>✕</button>
        </div>
      ) : (
        <div className="pr-field__display">
          <span className="pr-field__value">
            {value || <span className="pr-field__not-set">Not set</span>}
          </span>
          <button className="pr-field__edit-btn" onClick={() => onStartEdit(fieldKey, value)}>
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Profile Page ───────────────────────────────────────── */
const Profile = () => {
  const [user,            setUser]            = useState(null);
  const [editingField,    setEditingField]    = useState(null);
  const [editValue,       setEditValue]       = useState("");
  const [preview,         setPreview]         = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState("");
  const [locationLoading, setLocationLoading] = useState(false);


  /* ── Fetch user ── */
  useEffect(() => {
    getCurrentUser()
      .then((res) => { setUser(res.data); saveLocalUser(res.data); })
      .catch(() => {
        const local = loadLocalUser();
        if (local) setUser(local);
        else setError("Failed to load profile.");
      })
      .finally(() => setLoading(false));
  }, []);

  /* ── Field edit handlers ── */
  const startEdit  = (field, current) => { setEditingField(field); setEditValue(current || ""); };
  const cancelEdit = () => { setEditingField(null); setEditValue(""); };

  const saveField = async () => {
    try {
      const res = await updateUser(user.id, { [editingField]: editValue });
      setUser(res.data);
      saveLocalUser(res.data);
    } catch {
      const optimistic = { ...user, [editingField]: editValue };
      setUser(optimistic);
      saveLocalUser(optimistic);
    }
    setEditingField(null);
    setError("");
  };

  /* ── Image upload ── */
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    try {
      const res = await uploadProfileImage(user.id, file);
      setUser(res.data);
      saveLocalUser(res.data);
      setPreview(null);
    } catch {
      setError("Image upload failed.");
    }
  };

  /* ── GPS location ── */
  const updateLocation = () => {
    if (!navigator.geolocation) { setError("Geolocation not supported."); return; }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await axios.patch(
            `http://localhost:8888/user/${user.id}/location/gps`,
            { latitude: pos.coords.latitude, longitude: pos.coords.longitude, district: "COIMBATORE" }
          );
          setUser(res.data);
          saveLocalUser(res.data);
          setError("");
        } catch {
          setError("Could not update location.");
        } finally {
          setLocationLoading(false);
        }
      },
      () => { setError("Location access denied."); setLocationLoading(false); }
    );
  };

  /* ── Logout ── */
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem(LOCAL_KEY);
    keycloak.logout({ redirectUri: "http://localhost:5173" });
  };

  /* ── Loading screen ── */
  if (loading) {
    return (
      <div className="pr-loading">
        <div className="pr-spinner" />
        <p className="pr-loading-text">Loading your profile…</p>
      </div>
    );
  }

  const avatarSrc = preview || user?.profilePhotoUrl;

  /* ══════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════ */
  return (
  <>
  <Navbar/>
    <div className="pr-page">
      
      <div className="pr-inner">

        {/* ════ MAIN LAYOUT ════ */}
        <div className="pr-layout">

          {/* ── LEFT: Profile Card ── */}
          <div className="pr-card">

            {/* Header strip */}
            <div className="pr-card__header">
              <div>
                <p className="pr-card__header-eyebrow">Account</p>
                <h1 className="pr-card__header-title">My Profile</h1>
              </div>
              <div className="pr-card__header-dots">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="pr-card__header-dot" />
                ))}
              </div>
            </div>

            {/* Avatar + name */}
            <div className="pr-avatar-section">
              <div className="pr-avatar-wrap">
                {avatarSrc ? (
                  <img className="pr-avatar" src={avatarSrc} alt="Profile" />
                ) : (
                  <div className="pr-avatar-placeholder">{initials}</div>
                )}
                <label className="pr-avatar-upload" title="Change photo">
                  <svg width={13} height={13} viewBox="0 0 24 24" fill="none"
                    stroke="white" strokeWidth="2">
                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  <input type="file" accept="image/*" onChange={handleImageUpload} />
                </label>
              </div>

              <div className="pr-avatar-info">
                <p className="pr-avatar-name">{user?.userName || "Your Name"}</p>
                <p className="pr-avatar-email">{user?.email}</p>
                {user?.district && (
                  <span className="pr-avatar-district">
                    <svg width={11} height={11} viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                    </svg>
                    {user.district.charAt(0) + user.district.slice(1).toLowerCase()}
                  </span>
                )}
              </div>
            </div>

            {/* Error */}
            {error && <div className="pr-error">{error}</div>}

            {/* ── Personal Details ── */}
            <div className="pr-section-divider">
              <div className="pr-section-divider__line" />
              <span className="pr-section-divider__label">Personal Details</span>
              <div className="pr-section-divider__line" />
            </div>

            <div className="pr-fields">
              {PROFILE_FIELDS.map((f) => (
                <FieldRow
                  key={f.key}
                  label={f.label}
                  fieldKey={f.key}
                  value={user?.[f.key]}
                  editingField={editingField}
                  editValue={editValue}
                  setEditValue={setEditValue}
                  onStartEdit={startEdit}
                  onSave={saveField}
                  onCancel={cancelEdit}
                />
              ))}

              {/* Email — read-only */}
              <div className="pr-field">
                <span className="pr-field__label">Email</span>
                <div className="pr-field__display">
                  <span className="pr-field__value">{user?.email}</span>
                  <span className="pr-field__verified">
                    <svg width={10} height={10} viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                    </svg>
                    Verified
                  </span>
                </div>
              </div>
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
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                </div>
                <div>
                  <p className="pr-location__title">Current Coordinates</p>
                  <p className="pr-location__coords">
                    {user?.latitude && user?.longitude
                      ? `${user.latitude.toFixed(5)}° N,  ${user.longitude.toFixed(5)}° E`
                      : "Location not set yet"}
                  </p>
                </div>
              </div>

              <button
                className="pr-location__btn"
                onClick={updateLocation}
                disabled={locationLoading}
              >
                {locationLoading ? (
                  <>
                    <div className="pr-location__btn-spinner" />
                    Updating…
                  </>
                ) : (
                  <>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
                    </svg>
                    Use My Location
                  </>
                )}
              </button>
            </div>

            {/* Card footer */}
            <div className="pr-card__footer">
              <p className="pr-card__footer-note">
                🔒 Your data is securely stored and never shared.
              </p>
              <button className="pr-logout-btn" onClick={handleLogout}>
                <svg width={13} height={13} viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Sign Out
              </button>
            </div>
          </div>

          {/* ── RIGHT: Sidebar ── */}
          <aside className="pr-sidebar">

            {/* Stats */}
            <div className="pr-stats">
              <div className="pr-stats__header">
                <p className="pr-stats__title">Your Stats</p>
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

            {/* Security */}
            <div className="pr-security">
              <p className="pr-security__title">Security</p>
              <div className="pr-security__items">
                {SECURITY_ITEMS.map((item) => (
                  <div key={item} className="pr-security__item">
                    <span className="pr-security__dot" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="pr-cta-card">
              <p className="pr-cta-card__title">Become a Provider</p>
              <p className="pr-cta-card__sub">
                Grow your business and reach thousands of customers.
              </p>
              <button className="pr-cta-card__btn">
                Get Started →
              </button>
            </div>

          </aside>
        </div>
      </div>
    </div>
     <Footer/>
     </>
  );
};

export default Profile;