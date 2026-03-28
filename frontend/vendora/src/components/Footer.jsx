import React from 'react';
import { FiTwitter, FiFacebook, FiInstagram, FiLinkedin } from 'react-icons/fi';
import '../styles/Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container container">
        <div className="footer-top">
          <div className="footer-brand">
            <h2 className="logo-text gradient-text">Vendora</h2>
            <p className="brand-description">
              Elevating home services with cutting-edge technology and 
              world-class professionals.
            </p>
            <div className="social-links">
              <a href="#" className="social-icon"><FiTwitter /></a>
              <a href="#" className="social-icon"><FiFacebook /></a>
              <a href="#" className="social-icon"><FiInstagram /></a>
              <a href="#" className="social-icon"><FiLinkedin /></a>
            </div>
          </div>

          <div className="footer-links-grid">
            <div className="link-group">
              <h4>Company</h4>
              <ul>
                <li><a href="#">About us</a></li>
                <li><a href="#">Investor Relations</a></li>
                <li><a href="#">Terms & conditions</a></li>
                <li><a href="#">Privacy policy</a></li>
                <li><a href="#">Careers</a></li>
              </ul>
            </div>
            <div className="link-group">
              <h4>For customers</h4>
              <ul>
                <li><a href="#">Review services</a></li>
                <li><a href="#">Categories near you</a></li>
                <li><a href="#">Contact us</a></li>
                <li><a href="#">Safety</a></li>
              </ul>
            </div>
            <div className="link-group">
              <h4>For professionals</h4>
              <ul>
                <li><a href="#">Register as a professional</a></li>
                <li><a href="#">Partner support</a></li>
                <li><a href="#">Community</a></li>
              </ul>
            </div>
          </div>

          <div className="footer-apps">
            <h4>Get the app</h4>
            <div className="app-buttons">
              <a href="#" className="app-btn glass-morphism">
                <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" alt="App Store" />
              </a>
              <a href="#" className="app-btn glass-morphism">
                <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Play Store" />
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2026 Vendora Marketplace. All rights reserved.</p>
          <div className="footer-bottom-links">
            <a href="#">Anti-discrimination policy</a>
            <a href="#">Cookie settings</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
