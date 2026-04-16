import HeroSection from "../components/HeroSection";
import "../styles/home.css";

const benefits = [
  {
    icon: "✓",
    title: "Faster job discovery",
    description:
      "Get matched with verified local customers looking for your exact service.",
  },
  {
    icon: "⚙️",
    title: "Professional business tools",
    description:
      "Manage availability, quotes, and earnings from one modern dashboard.",
  },
  {
    icon: "⭐",
    title: "Trusted reputation",
    description:
      "Collect ratings, reviews, and repeat bookings from happy clients.",
  },
];

const metrics = [
  { value: "32K+", label: "Monthly job leads" },
  { value: "4.9/5", label: "Average provider rating" },
  { value: "18M+", label: "Customer requests served" },
];

export default function Home() {
  return (
    <main className="home-page">
      <HeroSection />

      <section className="home-intro">
        <div className="home-intro__copy">
          <p className="eyebrow">Built for independent professionals</p>
          <h2>
            Launch a premium provider experience that wins more clients every
            day.
          </h2>
          <p>
            Vendora gives skilled service providers the same polished
            marketplace presence used by top brands — without the complexity.
          </p>
        </div>

        <div className="home-benefits">
          {benefits.map((item) => (
            <article key={item.title} className="benefit-card">
              <div className="benefit-icon">{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home-partners">
        <p className="eyebrow">Trusted by local experts</p>
        <div className="partner-list">
          {["SmartFix", "CleanNest", "SparkPro", "BuildFlow", "HomeEase"].map(
            (brand) => (
              <span key={brand} className="partner-pill">
                {brand}
              </span>
            ),
          )}
        </div>
      </section>

      <section className="home-stats">
        <div className="stats-grid">
          {metrics.map((item) => (
            <div key={item.label} className="stat-card">
              <p className="stat-value">{item.value}</p>
              <p className="stat-label">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="home-cta">
        <div className="home-cta__inner">
          <div>
            <p className="eyebrow">Start your professional journey</p>
            <h2>
              Ready to turn your service business into a high-performing brand?
            </h2>
            <p>
              Sign up and begin accepting verified bookings with a polished
              provider profile today.
            </p>
          </div>
          <button className="btn-primary">Create Provider Profile</button>
        </div>
      </section>
    </main>
  );
}
