import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import axios from "../api/axios";
import "../styles/Provider.css";

/* ─── Constants ──────────────────────────────────────────── */
const CATEGORY_ICONS = {
  CLEANING:         "🧹",
  PLUMBING:         "🔧",
  ELECTRICAL:       "⚡",
  CARPENTRY:        "🪵",
  PAINTING:         "🎨",
  LANDSCAPING:      "🌿",
  PEST_CONTROL:     "🪲",
  AC_SERVICE:       "❄️",
  APPLIANCE_REPAIR: "🔩",
  DEFAULT:          "🛠️",
};

const CATEGORIES = [
  { key: "All",              label: "All Services"      },
  { key: "CLEANING",         label: "Cleaning"          },
  { key: "PLUMBING",         label: "Plumbing"          },
  { key: "ELECTRICAL",       label: "Electrical"        },
  { key: "CARPENTRY",        label: "Carpentry"         },
  { key: "PAINTING",         label: "Painting"          },
  { key: "AC_SERVICE",       label: "AC Service"        },
  { key: "APPLIANCE_REPAIR", label: "Appliance Repair"  },
  { key: "LANDSCAPING",      label: "Landscaping"       },
  { key: "PEST_CONTROL",     label: "Pest Control"      },
];

const SORT_OPTIONS = [
  { label: "Top Rated",          value: "rating"     },
  { label: "Nearest First",      value: "distance"   },
  { label: "Price: Low → High",  value: "price_asc"  },
  { label: "Price: High → Low",  value: "price_desc" },
  { label: "Most Reviewed",      value: "reviews"    },
];

/* ─── StarRating ─────────────────────────────────────────── */
function StarRating({ rating = 0 }) {
  return (
    <span className="pv-card__stars">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} width={13} height={13} viewBox="0 0 24 24"
          fill={s <= Math.round(rating) ? "#F59E0B" : "#E5E7EB"}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </span>
  );
}

/* ─── ProviderCard ───────────────────────────────────────── */
// Receives onChat from the parent Provider component
function ProviderCard({ provider, index, onChat }) {
  const [imgError, setImgError] = useState(false);

  const catIcon  = CATEGORY_ICONS[provider.serviceCategory] || CATEGORY_ICONS.DEFAULT;
  const showImg  = !imgError && provider.profilePhotoUrl;
  const isOnline = provider.isAvailable;

  // provider.userId is the providerId used to open the chat room
  const providerId = provider.userId || provider.id;

  return (
    <div className="pv-card" style={{ animationDelay: `${index * 0.05}s` }}>

      {/* Image / Avatar */}
      <div className="pv-card__img-wrap">
        {showImg ? (
          <img
            className="pv-card__img"
            src={provider.profilePhotoUrl}
            alt={provider.businessName}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="pv-card__avatar">
            <span className="pv-card__avatar-icon">{catIcon}</span>
            <span className="pv-card__avatar-initial">
              {provider.businessName?.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        <span className="pv-card__cat-tag">
          {catIcon} {(provider.serviceCategory || "SERVICE").replace(/_/g, " ")}
        </span>

        {provider.isAvailable !== undefined && (
          <span className={`pv-card__avail pv-card__avail--${isOnline ? "yes" : "no"}`}>
            <span className="pv-card__avail-dot" />
            {isOnline ? "Available" : "Unavailable"}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="pv-card__body">

        {/* Name + status */}
        <div className="pv-card__top">
          <span className="pv-card__name">{provider.businessName || "Provider"}</span>
          <span className={`pv-card__status pv-card__status--${provider.status || "INACTIVE"}`}>
            {provider.status}
          </span>
        </div>

        {/* Location */}
        <div className="pv-card__location">
          <span className="pv-card__location-icon">📍</span>
          {provider.district || "Location N/A"}
          {provider.distanceKm != null && ` · ${provider.distanceKm.toFixed(1)} km`}
        </div>

        {/* Description */}
        {provider.description && (
          <p className="pv-card__desc">{provider.description}</p>
        )}

        <div className="pv-card__divider" />

        {/* Rating */}
        <div className="pv-card__meta">
          <StarRating rating={provider.averageRating || 0} />
          <span className="pv-card__rating">
            {provider.averageRating ? provider.averageRating.toFixed(1) : "New"}
          </span>
          <span className="pv-card__dot">·</span>
          <span className="pv-card__reviews">{provider.totalReviews ?? 0} reviews</span>
          {provider.experienceYears && (
            <>
              <span className="pv-card__dot">·</span>
              <span className="pv-card__exp">{provider.experienceYears} yrs exp</span>
            </>
          )}
        </div>

        {/* Price + CTA */}
        <div className="pv-card__footer">
          <div>
            <span className="pv-card__price-from">Starting from</span>
            <span className="pv-card__price">
              {provider.basePrice != null
                ? `₹${provider.basePrice.toLocaleString("en-IN")}`
                : "On request"}
              {provider.priceUnit && (
                <span className="pv-card__price-unit"> /{provider.priceUnit}</span>
              )}
            </span>
          </div>

          {/* ✅ onClick receives a function reference, not a call result */}
          <button className="uc-btn" onClick={() => onChat(providerId)}>
            Chat
          </button>
          <button className="uc-btn uc-btn--book">Book Now</button>
        </div>

      </div>
    </div>
  );
}

/* ─── SkeletonCard ───────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="pv-skeleton">
      <div className="pv-skeleton__img" />
      <div className="pv-skeleton__body">
        <div className="pv-skeleton__line pv-skeleton__line--70"  />
        <div className="pv-skeleton__line pv-skeleton__line--50"  />
        <div className="pv-skeleton__line pv-skeleton__line--100" />
        <div className="pv-skeleton__line pv-skeleton__line--40"  />
      </div>
    </div>
  );
}

/* ─── Provider Page ──────────────────────────────────────── */
export default function Provider() {
  const navigate = useNavigate();

  const [providers,      setProviders]      = useState([]);
  const [filtered,       setFiltered]       = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);
  const [search,         setSearch]         = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy,         setSortBy]         = useState("rating");
  const [availableOnly,  setAvailableOnly]  = useState(false);

  /* ── handleChat: defined here, passed down as prop ── */
  const handleChat = (providerId) => {
    navigate(`/chat/${providerId}`);
  };

  /* ── Fetch ── */
  useEffect(() => {
    setLoading(true);
    axios
      .get("provider/all")
      .then((res) => setProviders(Array.isArray(res.data) ? res.data : []))
      .catch(() => setError("Failed to load providers. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  /* ── Filter + sort ── */
  useEffect(() => {
    let result = [...providers];

    if (activeCategory !== "All") {
      result = result.filter((p) => p.serviceCategory === activeCategory);
    }
    if (availableOnly) {
      result = result.filter((p) => p.isAvailable);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.businessName?.toLowerCase().includes(q)    ||
          p.description?.toLowerCase().includes(q)     ||
          p.district?.toLowerCase().includes(q)        ||
          p.serviceCategory?.toLowerCase().includes(q)
      );
    }

    const sorters = {
      rating:     (a, b) => (b.averageRating || 0)  - (a.averageRating || 0),
      distance:   (a, b) => (a.distanceKm    || 99) - (b.distanceKm    || 99),
      price_asc:  (a, b) => (a.basePrice     || 0)  - (b.basePrice     || 0),
      price_desc: (a, b) => (b.basePrice     || 0)  - (a.basePrice     || 0),
      reviews:    (a, b) => (b.totalReviews  || 0)  - (a.totalReviews  || 0),
    };
    result.sort(sorters[sortBy] || sorters.rating);
    setFiltered(result);
  }, [providers, search, activeCategory, sortBy, availableOnly]);

  /* ── Category counts ── */
  const countFor = (key) =>
    key === "All"
      ? providers.length
      : providers.filter((p) => p.serviceCategory === key).length;

  /* ── Clear all filters ── */
  const clearFilters = () => {
    setSearch("");
    setActiveCategory("All");
    setAvailableOnly(false);
  };

  /* ══════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════ */
  return (
    <div>
      <Navbar />

      {/* ════ BODY (sidebar + content) ════ */}
      <div className="pv-body">

        {/* ── Sidebar ── */}
        <aside className="pv-sidebar">

          {/* Categories */}
          <div className="pv-sidebar__block">
            <p className="pv-sidebar__title">Category</p>
            <div className="pv-sidebar__cats">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  className={`pv-sidebar__cat${activeCategory === cat.key ? " pv-sidebar__cat--active" : ""}`}
                  onClick={() => setActiveCategory(cat.key)}
                >
                  <span className="pv-sidebar__cat-icon">
                    {cat.key === "All" ? "🗂️" : (CATEGORY_ICONS[cat.key] || "🛠️")}
                  </span>
                  {cat.label}
                  <span className="pv-sidebar__cat-count">{countFor(cat.key)}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pv-sidebar__divider" />

          {/* Available now toggle */}
          <div className="pv-sidebar__block">
            <p className="pv-sidebar__title">Availability</p>
            <div
              className={`pv-avail-toggle${availableOnly ? " pv-avail-toggle--on" : ""}`}
              onClick={() => setAvailableOnly((v) => !v)}
            >
              <span className="pv-avail-toggle__label">Available Now</span>
              <label className="pv-avail-toggle__switch">
                <input type="checkbox" readOnly checked={availableOnly} />
                <span className="pv-avail-toggle__track" />
              </label>
            </div>
          </div>

        </aside>

        {/* ── Content ── */}
        <div className="pv-content">

          {/* Toolbar */}
          <div className="pv-toolbar">
            <div className="pv-toolbar__left">
              <div className="pv-toolbar__count">
                {loading
                  ? "Loading…"
                  : `${filtered.length} Provider${filtered.length !== 1 ? "s" : ""}`}
              </div>
              {!loading && !error && (
                <div className="pv-toolbar__sub">
                  {activeCategory === "All" ? "All categories" : activeCategory.replace(/_/g, " ")}
                  {availableOnly && " · Available only"}
                  {search && ` · "${search}"`}
                </div>
              )}
            </div>

            <div className="pv-toolbar__right">
              <span className="pv-toolbar__sort-label">Sort by</span>
              <select
                className="pv-toolbar__sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Grid */}
          <div className="pv-grid">

            {/* Error */}
            {error && (
              <div className="pv-error">
                <span className="pv-error__icon">⚠️</span>
                <p className="pv-error__msg">{error}</p>
                <button className="uc-btn uc-btn--primary" onClick={() => window.location.reload()}>
                  Try Again
                </button>
              </div>
            )}

            {/* Skeleton */}
            {loading && !error &&
              Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)
            }

            {/* Empty */}
            {!loading && !error && filtered.length === 0 && (
              <div className="pv-empty">
                <span className="pv-empty__icon">🔍</span>
                <p className="pv-empty__title">No providers found</p>
                <p className="pv-empty__sub">Try adjusting your filters or search term.</p>
                <button className="uc-btn uc-btn--ghost" onClick={clearFilters}>
                  Clear Filters
                </button>
              </div>
            )}

            {/* Cards — onChat passed as prop */}
            {!loading && !error && filtered.map((p, i) => (
              <ProviderCard
                key={p.userId}
                provider={p}
                index={i}
                onChat={handleChat}
              />
            ))}

          </div>
        </div>
      </div>

      {/* ════ CTA BANNER ════ */}
      {!loading && !error && (
        <div className="pv-cta">
          <div>
            <p className="pv-cta__title">Are you a service professional?</p>
            <p className="pv-cta__sub">Join 5,000+ providers growing their business on UrbanCare</p>
          </div>
          <div className="pv-cta__actions">
            <button className="uc-btn uc-btn--primary uc-btn--lg">Join as Provider</button>
            <button className="uc-btn uc-btn--outline-white uc-btn--lg">Learn More</button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}