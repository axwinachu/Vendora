import "../styles/Hero.css";

export default function HeroSection() {
  return (
    <section className="hero">
      <div className="hero__bg" />
      <div className="hero__blob hero__blob--1" />
      <div className="hero__blob hero__blob--2" />
      <div className="hero__grid" />

      <div className="hero__inner">
        <div className="hero__content">
          <div className="hero__badge">
            <span className="hero__badge-dot" />
            Trusted by premium service providers
          </div>

          <h1 className="hero__title">
            Turn Your Skills into a
            <span className="hero__title-accent">Thriving Business</span>
          </h1>

          <p className="hero__desc">
            Join skilled professionals on Vendora and connect with verified
            customers in your city. Set your own schedule, choose your services,
            and grow your income.
          </p>

          <div className="hero__highlights">
            {[
              "High-value service requests",
              "Verified customer connections",
              "Easy payout tracking",
            ].map((h) => (
              <div key={h} className="hero__highlight">
                {h}
              </div>
            ))}
          </div>

          <div className="hero__ctas">
            <button className="btn-primary hero__cta-main">
              Start Earning Today →
            </button>
            <button className="hero__cta-ghost">View Dashboard</button>
          </div>

          <div className="hero__trust">
            <div className="hero__stars">
              ★★★★★ <strong>4.9/5</strong>
            </div>
            <div className="hero__trust-sub">
              Trusted by premium service providers
            </div>
          </div>
        </div>
      </div>

      <div className="hero__wave">
        <svg viewBox="0 0 1440 80" preserveAspectRatio="none">
          <path
            d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z"
            fill="#FAFAFA"
          />
        </svg>
      </div>
    </section>
  );
}
