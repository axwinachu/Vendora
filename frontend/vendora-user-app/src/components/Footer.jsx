import React from "react";

export default function Footer() {
  return (
    <footer className="uc-footer">
      <div className="uc-section__inner">
        <div className="uc-footer__grid">
          <div className="uc-footer__brand">
            <div className="uc-footer__logo">
              <span className="uc-logo-icon">V</span>
              <span className="uc-logo-text">Vendora</span>
            </div>
            <p className="uc-footer__tagline">
              Professional home services at your doorstep.
            </p>
            <div className="uc-footer__socials">
              {["Twitter", "Instagram", "LinkedIn", "Facebook"].map((s) => (
                <a key={s} href="#" className="uc-social-btn" title={s}>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {[
            {
              title: "Company",
              links: [
                "About us",
                "Careers",
                "Press",
                "Blog",
                "Investor relations",
              ],
            },
            {
              title: "Services",
              links: [
                "Electrician",
                "Plumber",
                "Cleaning",
                "AC Repair",
                "Carpentry",
              ],
            },
            {
              title: "Support",
              links: [
                "Help center",
                "Safety",
                "Contact us",
                "Terms",
                "Privacy",
              ],
            },
          ].map((col) => (
            <div key={col.title} className="uc-footer__col">
              <h4 className="uc-footer__col-title">{col.title}</h4>
              <ul className="uc-footer__links">
                {col.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="uc-footer__link">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="uc-footer__bottom">
          <p>© 2026 Vendora Marketplace Pvt. Ltd. All rights reserved.</p>
          <p>Made with ❤️ in India</p>
        </div>
      </div>
    </footer>
  );
}
