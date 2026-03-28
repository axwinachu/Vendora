import React from 'react';
import { Link } from 'react-router-dom';
import { FiUser, FiMail, FiPhone, FiMapPin, FiEdit2, FiLogOut } from 'react-icons/fi';
import '../styles/ProfileDropdown.css';

const ProfileDropdown = ({ onClose }) => {
  // Dummy data
  const user = {
    name: 'Ceasw',
    email: 'ceasw@vendora.app',
    phone: '+91 98765 43210',
    district: 'Coimbatore',
    location: 'Saravanampatti, Coimbatore, Tamil Nadu'
  };

  return (
    <div className="profile-dropdown glass-morphism">
      <div className="profile-dropdown-header">
        <div className="dropdown-avatar">
          <FiUser className="avatar-icon" />
        </div>
        <div className="dropdown-info">
          <h3>{user.name}</h3>
          <p>{user.email}</p>
        </div>
      </div>

      <div className="profile-dropdown-content">
        <div className="info-item">
          <FiPhone className="info-icon" />
          <span>{user.phone}</span>
        </div>
        <div className="info-item">
          <FiMapPin className="info-icon" />
          <span>{user.district}</span>
        </div>
        <div className="profile-location">
          <small>{user.location}</small>
        </div>
      </div>

      <div className="profile-dropdown-footer">
        <Link to="/profile" className="view-profile-btn" onClick={onClose}>
          <FiEdit2 /> View Profile
        </Link>
        <button className="logout-btn">
          <FiLogOut /> Logout
        </button>
      </div>
    </div>
  );
};

export default ProfileDropdown;
