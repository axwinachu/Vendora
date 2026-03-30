import React, { useState, useEffect } from 'react';
import "../styles/Home.css"
export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [location, setLocation] = useState('Coimbatore');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`uc-navbar${scrolled ? ' uc-navbar--scrolled' : ''}`}>
      <div className="uc-navbar__inner">
        {/* Logo */}
        <a href="/" className="uc-navbar__logo">
          <span className="uc-logo-icon">V</span>
          <span className="uc-logo-text">Vendora</span>
        </a>

        {/* Location */}
        <button className="uc-navbar__location">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          <span>{location}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>

        {/* Search */}
        <div className="uc-navbar__search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" placeholder="Search for services..." className="uc-search-input" />
        </div>

        {/* Nav links */}
        <div className="uc-navbar__links">
          <a href="#" className="uc-nav-link">Services</a>
          <a href="#" className="uc-nav-link">How it works</a>
        </div>

        {/* Right actions */}
        <div className="uc-navbar__actions">
          <a href="/profile" className="uc-btn uc-btn--ghost">Sign in</a>
          <a href="/profile" className="uc-btn uc-btn--primary">Get the app</a>
        </div>
      </div>
    </nav>
  );
}