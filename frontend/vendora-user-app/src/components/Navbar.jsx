import React, { useState, useEffect } from "react";
import "../styles/Home.css";
import { Link } from "react-router-dom";
export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [location, setLocation] = useState(["Palakkad","coimabtore"]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

 const storedUser = localStorage.getItem("user_profile");
 const user = storedUser ? JSON.parse(storedUser) : null;
  console.log(user)
  return (
    <nav className={`uc-navbar${scrolled ? " uc-navbar--scrolled" : ""}`}>
      <div className="uc-navbar__inner">
        {/* Logo */}
        <a href="/" className="uc-navbar__logo">
          <span className="uc-logo-icon">V</span>
          <span className="uc-logo-text">Vendora</span>
        </a>

        {/* Nav links */}
        <div className="uc-navbar__links">
          <Link to="/providers" className="uc-nav-link">
            <b>Service</b>
          </Link>
          <Link to="/booking" className="uc-nav-link">
             <b>Bookings</b> 
          </Link>
        </div>

        {/* Right actions */}
        <div className="uc-navbar__actions">
          <a href="/profile" className="uc-btn uc-btn--ghost">
            {user?.userName.replace("@gmail.com","")||"login"}
          </a>
          <a href="/chat" className="uc-btn uc-btn--primary">
            Connect
          </a>
        </div>
      </div>
    </nav>
  );
}
