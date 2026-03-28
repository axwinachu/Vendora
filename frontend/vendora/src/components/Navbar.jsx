import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiSearch, FiMapPin, FiChevronDown, FiUser } from 'react-icons/fi';
import ProfileDropdown from './ProfileDropdown';
import '../styles/Navbar.css';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container container">
        {/* Left Side */}
        <div className="navbar-left">
          <Link to="/" className="navbar-logo">
            <span className="logo-text gradient-text">Vendora</span>
          </Link>
          <div className="location-selector" onClick={() => setShowLocationModal(!showLocationModal)}>
            <FiMapPin className="icon" />
            <span className="location-text">Coimbatore, Tamil Nadu</span>
            <FiChevronDown className={`chevron ${showLocationModal ? 'active' : ''}`} />
          </div>
        </div>

        {/* Center */}
        <div className="navbar-center">
          <div className="search-bar-wrapper">
            <FiSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Search services, users..." 
              className="search-input"
            />
          </div>
        </div>

        {/* Right Side */}
        <div className="navbar-right">
          <div className="profile-trigger" onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
            <div className="avatar-circle">
              <FiUser className="avatar-icon" />
            </div>
          </div>
          {showProfileDropdown && <ProfileDropdown onClose={() => setShowProfileDropdown(false)} />}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
