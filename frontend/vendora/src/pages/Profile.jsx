import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { FiUser, FiMail, FiPhone, FiMapPin, FiCamera, FiSave } from 'react-icons/fi';
import '../styles/Profile.css';

const Profile = () => {
  const [user, setUser] = useState({
    name: 'Ceasw',
    email: 'ceasw@vendora.app',
    phone: '+91 98765 43210',
    district: 'Coimbatore',
    location: 'Saravanampatti, Coimbatore, Tamil Nadu'
  });

  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = (e) => {
    e.preventDefault();
    setIsUpdating(true);
    setTimeout(() => {
      setIsUpdating(false);
      alert('Profile updated successfully!');
    }, 1500);
  };

  return (
    <div className="profile-page">
      <Navbar />
      
      <main className="profile-main container">
        <div className="profile-header">
          <h1 className="section-title">Manage Your <span className="gradient-text">Profile</span></h1>
          <p className="section-subtitle">Keep your information up to date for better service</p>
        </div>

        <div className="profile-content-grid">
          {/* Left: Profile Summary Card */}
          <aside className="profile-sidebar">
            <div className="profile-card glass-morphism">
              <div className="profile-image-container">
                <div className="avatar-large">
                  <FiUser className="avatar-icon" />
                  <button className="camera-btn"><FiCamera /></button>
                </div>
              </div>
              <div className="profile-card-info">
                <h3>{user.name}</h3>
                <p>{user.email}</p>
              </div>
              <div className="profile-card-stats">
                <div className="stat-item">
                  <span className="stat-value">12</span>
                  <span className="stat-label">Services Booked</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">5</span>
                  <span className="stat-label">Member Months</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Right: Profile Form */}
          <section className="profile-form-section">
            <form className="profile-form glass-morphism" onSubmit={handleUpdate}>
              <div className="form-grid">
                <div className="form-group">
                  <label><FiUser /> Full Name</label>
                  <input 
                    type="text" 
                    value={user.name} 
                    onChange={(e) => setUser({...user, name: e.target.value})}
                    placeholder="Enter your name"
                  />
                </div>
                <div className="form-group">
                  <label><FiMail /> Email Address</label>
                  <input 
                    type="email" 
                    value={user.email} 
                    onChange={(e) => setUser({...user, email: e.target.value})}
                    placeholder="Enter your email"
                  />
                </div>
                <div className="form-group">
                  <label><FiPhone /> Phone Number</label>
                  <input 
                    type="text" 
                    value={user.phone} 
                    onChange={(e) => setUser({...user, phone: e.target.value})}
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>
                <div className="form-group">
                  <label><FiMapPin /> District</label>
                  <input 
                    type="text" 
                    value={user.district} 
                    onChange={(e) => setUser({...user, district: e.target.value})}
                    placeholder="District name"
                  />
                </div>
              </div>
              
              <div className="form-group full-width">
                <label><FiMapPin /> Precise Location</label>
                <textarea 
                  rows="3"
                  value={user.location} 
                  onChange={(e) => setUser({...user, location: e.target.value})}
                  placeholder="Street, Landmark, City..."
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={isUpdating}>
                  {isUpdating ? 'Updating...' : <><FiSave /> Update Profile</>}
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Profile;
