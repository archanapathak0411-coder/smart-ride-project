import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { myRides, myBookings } from "../api";

export default function DashboardPage() {
  const { user } = useAuth();
  const [offered, setOffered] = useState([]);
  const [joined, setJoined]   = useState([]);

  useEffect(() => {
    myRides().then(d => setOffered(d.rides || [])).catch(() => {});
    myBookings().then(d => setJoined(d.bookings || [])).catch(() => {});
  }, []);

  const firstName = user?.name?.split(" ")[0] || user?.email?.split("@")[0] || "there";

  // upcoming offered rides
  const upcomingOffered = offered.filter(r => r.status === "open" || r.status === "full").slice(0, 3);
  // pending booking requests on driver's rides
  const pendingRequests = offered.flatMap(r => (r.bookings || []).filter(b => b.status === "pending"));
  // joined rides
  const recentJoined = joined.slice(0, 3);

  const nextRide = upcomingOffered[0] || null;

  return (
    <div>
      <p className="welcome-heading">Welcome, {firstName}! 👋</p>
      <p className="welcome-sub">Let's make your journey easier today.</p>

      {/* Quick action cards */}
      <div className="quick-actions">
        <Link className="qa-card" to="/find">
          <div className="qa-icon blue">🔍</div>
          <h3>Find Rides</h3>
          <p>Search available rides near you</p>
          <span className="qa-link">Search →</span>
        </Link>
        <Link className="qa-card" to="/offer">
          <div className="qa-icon green">🚗</div>
          <h3>Offer Ride</h3>
          <p>Share your vehicle with others</p>
          <span className="qa-link">Offer →</span>
        </Link>
        <Link className="qa-card" to="/rides">
          <div className="qa-icon purple">📋</div>
          <h3>My Rides</h3>
          <p>View your upcoming &amp; past rides</p>
          <span className="qa-link">View →</span>
        </Link>
        <div className="qa-card" style={{ cursor: "default" }}>
          <div className="qa-icon orange">💬</div>
          <h3>Messages</h3>
          <p>Chat with your ride partners</p>
          <span className="qa-link">Open →</span>
        </div>
      </div>

      {/* Recent rides + upcoming */}
      <div className="dash-row">
        {/* Left: recent rides */}
        <div className="card">
          <div className="dash-section-title">
            <h2>Recent Rides</h2>
            <Link to="/rides">View All →</Link>
          </div>

          {recentJoined.length === 0 && upcomingOffered.length === 0 && (
            <p className="muted" style={{ fontSize: "0.88rem" }}>No rides yet. <Link to="/find">Find one →</Link></p>
          )}

          {/* joined bookings */}
          {recentJoined.map(booking => (
            <div key={booking.id} className="recent-ride-item">
              <div className="rr-avatar">{(booking.ride?.driver?.name || "D")[0].toUpperCase()}</div>
              <div className="rr-info">
                <div className="rr-route">
                  {booking.ride?.pickup_place} → {booking.ride?.drop_place}
                </div>
                <div className="rr-meta">
                  {booking.ride?.ride_date} · {booking.ride?.departure_time?.slice(0,5)} · {booking.status}
                </div>
              </div>
              <Link className="btn sm" to="/rides">View</Link>
            </div>
          ))}

          {/* offered rides with pending passengers */}
          {pendingRequests.slice(0, 2).map(b => (
            <div key={b.id} className="recent-ride-item">
              <div className="rr-avatar" style={{ background: "#fef3c7", color: "#92400e" }}>
                {(b.passenger?.name || "P")[0].toUpperCase()}
              </div>
              <div className="rr-info">
                <div className="rr-route">{b.passenger?.name} — seat request</div>
                <div className="rr-meta">Status: {b.status}</div>
              </div>
              <Link className="btn sm secondary" to="/rides">Manage</Link>
            </div>
          ))}
        </div>

        {/* Right: upcoming ride */}
        <div>
          <div className="dash-section-title">
            <h2>Upcoming Ride</h2>
            <Link to="/rides">View All →</Link>
          </div>

          {nextRide ? (
            <div className="upcoming-card">
              <h3>TODAY, {nextRide.departure_time?.slice(0,5)} AM</h3>
              <div className="uc-item">
                <div className="uc-dot" />
                <div>
                  <div className="uc-label">From</div>
                  <div className="uc-value">{nextRide.pickup_place}</div>
                </div>
              </div>
              <div className="uc-item">
                <div className="uc-dot" style={{ background: "#93c5fd" }} />
                <div>
                  <div className="uc-label">To</div>
                  <div className="uc-value">{nextRide.drop_place}</div>
                </div>
              </div>
              <div style={{ fontSize: "0.82rem", opacity: 0.8, marginTop: 8 }}>
                🪑 {nextRide.available_seats} Seats · 🚗 Car
              </div>
              <Link className="btn outline" to="/rides" style={{ marginTop: 14, display: "inline-block" }}>
                View Details
              </Link>
            </div>
          ) : (
            <div className="upcoming-card" style={{ background: "#1e293b" }}>
              <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>No upcoming rides.</p>
              <Link className="btn" to="/offer" style={{ marginTop: 12, display: "inline-block", background: "var(--blue)" }}>
                Offer a Ride
              </Link>
            </div>
          )}

          <div style={{ marginTop: 16, borderRadius: 14, overflow: "hidden" }}>
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/J_C_Bose_University_of_Science_and_Technology%2C_YMCA%2C_Faridabad.jpg/480px-J_C_Bose_University_of_Science_and_Technology%2C_YMCA%2C_Faridabad.jpg"
              alt="JC Bose University"
              style={{ width: "100%", height: 120, objectFit: "cover", display: "block" }}
            />
            <div style={{ background: "#1e293b", color: "white", padding: "10px 14px", textAlign: "center", fontSize: "0.8rem" }}>
              🌿 Together for a Greener Tomorrow
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

