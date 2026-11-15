import { Link, useNavigate } from "react-router-dom";
import SearchForm from "../components/SearchForm";
import { useAuth } from "../context/AuthContext";

const FEATURES = [
  { icon: "💰", bg: "green",  label: "Save Money",        sub: "Share your ride and reduce travel costs." },
  { icon: "🌿", bg: "green",  label: "Go Green",           sub: "Less vehicles, less pollution." },
  { icon: "🛡️", bg: "purple", label: "Safe & Trusted",    sub: "Verified students, safer rides." },
  { icon: "🤝", bg: "orange", label: "Build Connections",  sub: "Meet and travel with fellow students." },
  { icon: "⚡", bg: "blue",   label: "Convenient",         sub: "Easy booking, real-time updates." },
];

const STEPS = [
  { num: 1, icon: "👤", bg: "green",  title: "Sign Up",              desc: "Create your account in seconds with your student ID." },
  { num: 2, icon: "🔍", bg: "blue",   title: "Find or Offer Ride",   desc: "Search for rides or post your own to share." },
  { num: 3, icon: "🚗", bg: "purple", title: "Travel Together",      desc: "Confirm, meet and start your journey!" },
];

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div>
      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-inner">
          <div className="hero-text">
            <div className="hero-eyebrow">🎓 JC Bose University</div>
            <h1>
              Your Campus Ride,<br />
              Made <span className="accent">Smarter</span>
            </h1>
            <p className="hero-lead">
              Find or offer rides, travel together, save money and make your journey eco-friendly!
            </p>
            <div className="hero-actions">
              <Link className="btn btn-primary btn-lg" to="/find">
                🔍 Find Ride
              </Link>
              <Link className="btn btn-outline btn-lg" to="/offer"
                style={{ color: "#fff", borderColor: "rgba(255,255,255,.5)" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.12)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
              >
                🚗 Offer Ride
              </Link>
            </div>
            <p style={{ marginTop: 20, fontSize: "0.82rem", color: "rgba(255,255,255,.5)" }}>
              Together We Go Further ✨
            </p>
          </div>

          {/* Search panel visible on desktop */}
          <div className="hero-search">
            <h2>🔍 Search a Ride</h2>
            <SearchForm compact />
          </div>
        </div>
      </section>

      {/* ── FEATURES STRIP ── */}
      <div className="features-strip">
        <div className="features-strip-inner">
          {FEATURES.map((f) => (
            <div className="feature-item" key={f.label}>
              <div className={`feature-icon ${f.bg}`}>{f.icon}</div>
              <span className="feature-label">{f.label}</span>
              <span className="feature-sub">{f.sub}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── STATS ── */}
      <section className="stats-section">
        <div className="stats-inner">
          <div className="stats-left">
            <h2>A Greener Campus<br />Starts With You <span className="leaf">🌿</span></h2>
            <p>Every shared ride means fewer vehicles, less pollution, and more savings for everyone.</p>
            <div className="stats-row">
              <div className="stat-item">
                <div className="stat-num">1000+</div>
                <div className="stat-label">Students</div>
              </div>
              <div className="stat-item">
                <div className="stat-num">250+</div>
                <div className="stat-label">Rides Completed</div>
              </div>
              <div className="stat-item">
                <div className="stat-num">50+</div>
                <div className="stat-label">CO₂ Reduced (kg)</div>
              </div>
            </div>
            <div style={{ marginTop: 28, display: "flex", gap: 12, flexWrap: "wrap" }}>
              {!user && (
                <Link className="btn btn-primary" to="/register">
                  Get Started Free
                </Link>
              )}
              <Link className="btn btn-ghost" to="/find">
                Browse Rides →
              </Link>
            </div>
          </div>

          <div style={{
            background: "linear-gradient(135deg, #0d6e4f, #22c55e)",
            borderRadius: 20,
            padding: 32,
            color: "#fff",
            textAlign: "center",
            boxShadow: "0 10px 30px rgba(13,110,79,.3)"
          }}>
            <div style={{ fontSize: "4rem", marginBottom: 12 }}>🏫</div>
            <h3 style={{ fontWeight: 800, fontSize: "1.2rem", marginBottom: 8 }}>
              Same Campus<br />Same Roads
            </h3>
            <p style={{ opacity: 0.85, fontSize: "0.9rem", fontStyle: "italic" }}>
              Better Together ✨
            </p>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="how-section">
        <div className="how-inner">
          <p className="section-eyebrow">Simple Process</p>
          <h2 className="section-title">How It Works?</h2>
          <p className="section-sub">Get started in just 3 simple steps</p>

          <div className="steps-row">
            {STEPS.map((step) => (
              <div className="step-card" key={step.num}>
                <div className="step-num">{step.num}</div>
                <div className={`step-icon ${step.bg}`}>{step.icon}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
