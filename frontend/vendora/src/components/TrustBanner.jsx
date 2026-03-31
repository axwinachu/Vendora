import React from "react";

const TRUST = [
  {
    icon: "🛡️",
    title: "Verified Professionals",
    desc: "Every expert is background-checked and skill-tested before onboarding.",
  },
  {
    icon: "💳",
    title: "Transparent Pricing",
    desc: "No hidden charges. What you see is exactly what you pay.",
  },
  {
    icon: "⭐",
    title: "Satisfaction Guaranteed",
    desc: "Not happy? We'll re-do the service at no extra cost.",
  },
  {
    icon: "📍",
    title: "Service at Your Door",
    desc: "Our professionals come to you — no travel hassle.",
  },
];

export default function TrustBanner() {
  return (
    <section className="uc-trust">
      <div className="uc-section__inner">
        <div className="uc-trust__top">
          <p className="uc-section__eyebrow">Why Vendora</p>
          <h2 className="uc-section__title">
            India's most trusted home service platform
          </h2>
          <p className="uc-trust__desc">
            Millions of happy customers across 25+ cities trust us for quality
            home services.
          </p>
        </div>

        <div className="uc-trust-grid">
          {TRUST.map((item) => (
            <div key={item.title} className="uc-trust-card">
              <div className="uc-trust-card__icon">{item.icon}</div>
              <h3 className="uc-trust-card__title">{item.title}</h3>
              <p className="uc-trust-card__desc">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
