import React from 'react';
import { FiArrowRight, FiCheckCircle } from 'react-icons/fi';
import '../styles/Hero.css';

const Hero = () => {
  return (
    <section className="hero">
      <div className="hero-container container">
        <div className="hero-content">
          <h4 className="hero-subtitle">Premium Service Marketplace</h4>
          <h1 className="hero-title">
            Find the Best <span className="gradient-text">Professionals</span> for Your Home
          </h1>
          <p className="hero-description">
            Experience the future of home services. Reliable, high-quality solutions 
            at your doorstep with just a few clicks.
          </p>
          <div className="hero-actions">
            <button className="btn-primary">
              Explore Services <FiArrowRight />
            </button>
            <div className="hero-stats">
              <div className="stat">
                <FiCheckCircle className="stat-icon" />
                <span>Verified Partners</span>
              </div>
              <div className="stat">
                <FiCheckCircle className="stat-icon" />
                <span>Insured Work</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="hero-visual">
          <div className="hero-shape shape-1"></div>
          <div className="hero-shape shape-2"></div>
          <div className="hero-card glass-morphism">
            <div className="hero-card-header">
              <div className="hero-card-dot" style={{ background: '#ff5f57' }}></div>
              <div className="hero-card-dot" style={{ background: '#febc2e' }}></div>
              <div className="hero-card-dot" style={{ background: '#28c840' }}></div>
            </div>
            <div className="hero-card-body">
              <div className="placeholder-line title"></div>
              <div className="placeholder-line text"></div>
              <div className="placeholder-line textShort"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
