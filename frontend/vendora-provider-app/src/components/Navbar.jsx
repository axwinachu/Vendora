import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "../styles/Navbar.css";

export default function ProviderNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [online, setOnline] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const user = JSON.parse(localStorage.getItem("user_profile") || "{}");
  const name = user?.userName?.replace("@gmail.com", "") || "Provider";
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <nav className={`nav ${scrolled ? "nav--scrolled" : ""}`}>
      <div className="nav__inner">

        {/* LOGO */}
        <Link to="/" className="nav__logo">
          <span className="logo-box">V</span>
          <span className="logo-text">Vendora</span>
        </Link>

        {/* LINKS */}
        <div className="nav__links">
          <Link className={location.pathname === "/dashboard" ? "active" : ""} to="/dashboard">Dashboard</Link>
          <Link className={location.pathname.includes("/chat") ? "active" : ""} to="/chat">Chat</Link>
          <Link className={location.pathname === "/profile" ? "active" : ""} to="/profile">Profile</Link>
        </div>

        {/* RIGHT SIDE */}
        <div className="nav__actions">

          {/* PROFILE */}
          <div
            className="profile"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            ref={dropdownRef}
          >
            <div className="avatar">{initials}</div>

            {dropdownOpen && (
              <div className="dropdown">
                <p className="dropdown__name">{name}</p>
                <button onClick={() => navigate("/profile")}>Profile</button>
                <button onClick={() => navigate("/dashboard")}>Dashboard</button>
                <button className="logout">Logout</button>
              </div>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}