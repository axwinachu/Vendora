import React, { useState } from 'react';

const SUGGESTIONS = ['Electrician', 'Plumber', 'AC Repair', 'House Cleaning', 'Carpenter', 'Painting'];

export default function Hero() {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);

  const filtered = SUGGESTIONS.filter(s => s.toLowerCase().includes(query.toLowerCase()));

  return (
    <section className="uc-hero">
      {/* Decorative circles */}
      <div className="uc-hero__circle uc-hero__circle--1" />
      <div className="uc-hero__circle uc-hero__circle--2" />

      <div className="uc-hero__inner">
        <div className="uc-hero__text">
          <div className="uc-hero__pill">
            <span className="uc-pill-dot" />
            Trusted by 5M+ customers
          </div>
          <h1 className="uc-hero__title">
            Home services,<br />
            <span className="uc-hero__title--accent">done right.</span>
          </h1>
          <p className="uc-hero__subtitle">
            Professional home services at your doorstep — vetted experts, transparent pricing, guaranteed satisfaction.
          </p>

          {/* Search bar */}
          <div className={`uc-hero__searchbox${focused ? ' uc-hero__searchbox--focused' : ''}`}>
            <svg className="uc-searchbox__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="What service do you need?"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setTimeout(() => setFocused(false), 150)}
              className="uc-searchbox__input"
            />
            <button className="uc-searchbox__btn">Search</button>

            {focused && query.length > 0 && filtered.length > 0 && (
              <div className="uc-searchbox__dropdown">
                {filtered.map(s => (
                  <button key={s} className="uc-searchbox__suggestion" onClick={() => setQuery(s)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"/>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick pills */}
          <div className="uc-hero__quick">
            <span className="uc-quick-label">Popular:</span>
            {SUGGESTIONS.slice(0, 4).map(s => (
              <button key={s} className="uc-quick-pill" onClick={() => setQuery(s)}>{s}</button>
            ))}
          </div>
        </div>

        {/* Visual side */}
        <div className="uc-hero__visual">
          <div className="uc-hero-card uc-hero-card--main">
            <div className="uc-hero-card__badge">⭐ 4.9 • 2,400 reviews</div>
            <div className="uc-hero-card__avatar">
              <div className="uc-avatar-ring">
                <div className="uc-avatar-inner">🔧</div>
              </div>
            </div>
            <div className="uc-hero-card__info">
              <div className="uc-hero-card__name">Rajesh K.</div>
              <div className="uc-hero-card__role">Senior Electrician</div>
              <div className="uc-hero-card__chips">
                <span className="uc-chip uc-chip--green">✓ Verified</span>
                <span className="uc-chip uc-chip--blue">300+ Jobs</span>
              </div>
            </div>
          </div>

          <div className="uc-hero-card uc-hero-card--stat uc-hero-card--stat-1">
            <div className="uc-stat-emoji">🏠</div>
            <div className="uc-stat-num">50K+</div>
            <div className="uc-stat-lbl">Homes Served</div>
          </div>

          <div className="uc-hero-card uc-hero-card--stat uc-hero-card--stat-2">
            <div className="uc-stat-emoji">⚡</div>
            <div className="uc-stat-num">60 min</div>
            <div className="uc-stat-lbl">Avg Response</div>
          </div>
        </div>
      </div>
    </section>
  );
}