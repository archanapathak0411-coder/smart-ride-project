import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-body">
          <p className="hero-eyebrow">J.C. Bose University of Science &amp; Technology, YMCA</p>
          <h1>JC SmartRide</h1>
          <h2 style={{ fontWeight: 700, fontSize: "1.4rem", marginBottom: 14, color: "#bfdbfe" }}>
            Campus Carpooling for<br />J.C. Bose University, Faridabad
          </h2>
          <p className="hero-lead">
            Travel together, save money, reduce pollution<br />
            and make your campus journey easier!
          </p>
          <div className="hero-actions">
            <Link className="btn" to="/find">
              🔍 Find a Ride
            </Link>
            <Link className="btn outline" to="/offer">
              🚗 Offer a Ride
            </Link>
          </div>
        </div>
      </section>

      {/* ── Feature strip ── */}
      <section className="features">
        <div className="feature-card">
          <div className="feature-icon" style={{ background: "#fef3c7" }}>💰</div>
          <h3>Save Money</h3>
          <p>Split your travel costs with fellow students.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon" style={{ background: "#d1fae5" }}>🌿</div>
          <h3>Eco Friendly</h3>
          <p>Less vehicles, less pollution.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon" style={{ background: "#dbeafe" }}>🛡️</div>
          <h3>Safe &amp; Trusted</h3>
          <p>Verified users &amp; secure rides.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon" style={{ background: "#ede9fe" }}>📱</div>
          <h3>Easy to Use</h3>
          <p>Book or offer rides in just a few clicks.</p>
        </div>
      </section>

      {/* ── How it works ── */}
      <div style={{ padding: "40px 32px", maxWidth: 1100, margin: "0 auto" }}>
        <h2 style={{ textAlign: "center", marginBottom: 28, fontWeight: 800 }}>How it works</h2>
        <div className="grid three" style={{ gap: 20 }}>
          <article className="card" style={{ textAlign: "center", padding: 28 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📝</div>
            <h3 style={{ marginBottom: 8, fontWeight: 700 }}>Smart Match</h3>
            <p className="muted" style={{ fontSize: "0.88rem" }}>
              Pickup, drop, time, cost, seats and ratings combined into one score using KNN.
            </p>
          </article>
          <article className="card" style={{ textAlign: "center", padding: 28 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🎓</div>
            <h3 style={{ marginBottom: 8, fontWeight: 700 }}>Campus Only</h3>
            <p className="muted" style={{ fontSize: "0.88rem" }}>
              Sign up with your student ID. Admin verifies it before you can offer or book a seat.
            </p>
          </article>
          <article className="card" style={{ textAlign: "center", padding: 28 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>💸</div>
            <h3 style={{ marginBottom: 8, fontWeight: 700 }}>See What You Save</h3>
            <p className="muted" style={{ fontSize: "0.88rem" }}>
              After a trip, compare the shared amount with what you would have paid alone.
            </p>
          </article>
        </div>
      </div>
    </>
  );
}
