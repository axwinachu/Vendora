import { useEffect, useState } from "react";
import {
  getCurrentUser,
  updateUser,
  uploadProfileImage
} from "../api/userApi";
import axios from "../api/axios";
import "../styles/Profile.css";

const LOCAL_KEY = "user_profile";

const loadLocalUser = () => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY));
  } catch {
    return null;
  }
};

const saveLocalUser = (data) => {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
};

const QUOTES = [
  { text: "Your home deserves the best. So do you.", author: "Urban Craft" },
  { text: "Excellence is not a skill — it's an attitude.", author: "Ralph Marston" },
  { text: "Every great service begins with a great professional.", author: "Urban Craft" },
  { text: "Build trust. One job at a time.", author: "Urban Craft" },
];

const DISTRICTS = ["COIMBATORE", "CHENNAI", "MADURAI", "TRICHY", "SALEM", "TIRUNELVELI"];

/* ─── Reusable field row ─────────────────────────────────── */
const FieldRow = ({
  label, fieldKey, value,
  editingField, editValue, setEditValue,
  onStartEdit, onSave, onCancel,
}) => (
  <div className="field-row">
    <span className="field-label">{label}</span>

    {editingField === fieldKey ? (
      <div className="edit-inline">
        {fieldKey === "district" ? (
          <select
            className="field-select"
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
          >
            <option value="">Select District</option>
            {DISTRICTS.map(d => (
              <option key={d} value={d}>
                {d.charAt(0) + d.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        ) : (
          <input
            className="field-input"
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            placeholder={`Enter ${label.toLowerCase()}`}
          />
        )}
        <button className="icon-btn save-btn" onClick={onSave}>✓</button>
        <button className="icon-btn cancel-btn" onClick={onCancel}>✕</button>
      </div>
    ) : (
      <div className="display-inline">
        <span className="field-value">
          {value || <span className="not-set">Not set</span>}
        </span>
        <button className="edit-btn" onClick={() => onStartEdit(fieldKey, value)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
      </div>
    )}
  </div>
);

/* ─── Main Component ─────────────────────────────────────── */
const Profile = () => {
  const [user, setUser] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [value, setValue] = useState("");
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [quoteIndex] = useState(() => Math.floor(Math.random() * QUOTES.length));
  const [imageHover, setImageHover] = useState(false);

  /* Load user */
  useEffect(() => {
    getCurrentUser()
      .then(res => { setUser(res.data); saveLocalUser(res.data); })
      .catch(() => {
        const local = loadLocalUser();
        if (local) setUser(local);
        else setError("Failed to load profile");
      })
      .finally(() => setLoading(false));
  }, []);

  const startEdit = (field, currentValue) => {
    setEditingField(field);
    setValue(currentValue || "");
  };

  const saveField = async () => {
    try {
      const res = await updateUser(user.id, { [editingField]: value });
      setUser(res.data);
      saveLocalUser(res.data);
    } catch {
      const updated = { ...user, [editingField]: value };
      setUser(updated);
      saveLocalUser(updated);
    }
    setEditingField(null);
    setError("");
  };

  const cancelEdit = () => { setEditingField(null); setValue(""); };

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
      setError("Image upload failed");
    }
  };

  const updateLocationFromGPS = () => {
    if (!navigator.geolocation) { setError("Geolocation not supported"); return; }
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
          setError("Backend error ❌");
        } finally {
          setLocationLoading(false);
        }
      },
      () => { setError("Location error ❌"); setLocationLoading(false); }
    );
  };

  /* Loading screen */
  if (loading) return (
    <div className="loading-wrapper">
      <div className="spinner" />
      <p className="loading-text">Loading your profile...</p>
    </div>
  );

  const quote = QUOTES[quoteIndex];
  const initials = user?.userName
    ? user.userName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  return (
    <div className="profile-page">
      {/* Background orbs */}
      <div className="bg-orb orb-1" />
      <div className="bg-orb orb-2" />

      <div className="profile-container">

        {/* ── Quote Banner ── */}
        <div className="quote-banner">
          <span className="quote-icon">"</span>
          <div>
            <p className="quote-text">{quote.text}</p>
            <p className="quote-author">— {quote.author}</p>
          </div>
        </div>

        {/* ── Profile Card ── */}
        <div className="profile-card">

          {/* Header strip */}
          <div className="card-header">
            <div className="header-content">
              <div className="header-badge">Professional Profile</div>
              <h1 className="page-title">My Account</h1>
            </div>
            <div className="header-dots">
              {[...Array(6)].map((_, i) => <div key={i} className="header-dot" />)}
            </div>
          </div>

          {/* Avatar + Name */}
          <div className="avatar-section">
            <div
              className={`avatar-wrap${imageHover ? " avatar-hovered" : ""}`}
              onMouseEnter={() => setImageHover(true)}
              onMouseLeave={() => setImageHover(false)}
            >
              {preview || user?.profilePhotoUrl ? (
                <img src={preview || user.profilePhotoUrl} alt="profile" className="avatar-img" />
              ) : (
                <div className="avatar-placeholder">{initials}</div>
              )}
              <label className={`avatar-overlay${imageHover ? " overlay-visible" : ""}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                  stroke="white" strokeWidth="2">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                <span className="overlay-label">CHANGE</span>
                <input type="file" onChange={handleImageUpload} hidden accept="image/*" />
              </label>
            </div>

            <div className="name-block">
              <h2 className="user-name">{user?.userName || "Your Name"}</h2>
              <p className="user-email">{user?.email}</p>
              {user?.district && (
                <span className="district-tag">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                  {user.district.charAt(0) + user.district.slice(1).toLowerCase()}
                </span>
              )}
            </div>
          </div>

          {error && <div className="error-box">{error}</div>}

          {/* Personal Details */}
          <div className="section-divider">
            <div className="divider-line" />
            <span className="divider-label">Personal Details</span>
            <div className="divider-line" />
          </div>

          <div className="fields-grid">
            {[
              { label: "Full Name", key: "userName" },
              { label: "Phone", key: "phone" },
              { label: "District", key: "district" },
            ].map(f => (
              <FieldRow
                key={f.key}
                label={f.label}
                fieldKey={f.key}
                value={user?.[f.key]}
                editingField={editingField}
                editValue={value}
                setEditValue={setValue}
                onStartEdit={startEdit}
                onSave={saveField}
                onCancel={cancelEdit}
              />
            ))}

            {/* Email — read-only */}
            <div className="field-row">
              <span className="field-label">Email Address</span>
              <div className="display-inline">
                <span className="field-value">{user?.email}</span>
                <span className="verified-badge">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  </svg>
                  Verified
                </span>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="section-divider">
            <div className="divider-line" />
            <span className="divider-label">Location</span>
            <div className="divider-line" />
          </div>

          <div className="location-card">
            <div className="location-info">
              <div className="location-icon-wrap">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#5B5FEF">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
              </div>
              <div>
                <p className="location-title">Current Coordinates</p>
                <p className="location-coords">
                  {user?.latitude && user?.longitude
                    ? `${user.latitude.toFixed(5)}° N,  ${user.longitude.toFixed(5)}° E`
                    : "Location not set yet"}
                </p>
              </div>
            </div>

            <button
              className={`location-btn${locationLoading ? " location-btn-disabled" : ""}`}
              onClick={updateLocationFromGPS}
              disabled={locationLoading}
            >
              {locationLoading ? (
                <><div className="btn-spinner" /> Updating...</>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
                  </svg>
                  Use My Location
                </>
              )}
            </button>
          </div>

          {/* Footer */}
          <div className="card-footer">
            <p className="footer-text">
              🔒 Your information is securely stored and never shared without consent.
            </p>
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div className="stats-row">
          {[
            { icon: "⭐", label: "Rating", value: "4.9" },
            { icon: "✅", label: "Jobs Done", value: "128" },
            { icon: "🏅", label: "Badge", value: "Pro" },
          ].map((s, i) => (
            <div key={i} className="stat-card">
              <span className="stat-icon">{s.icon}</span>
              <span className="stat-value">{s.value}</span>
              <span className="stat-label">{s.label}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default Profile;