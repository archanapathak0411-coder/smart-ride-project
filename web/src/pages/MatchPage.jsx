import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { requestBooking, searchRides } from "../api";
import RideCard from "../components/RideCard";
import RideMap from "../components/RideMap";
import { useAuth } from "../context/AuthContext";

function readSavedSearch() {
  const raw = sessionStorage.getItem("jc_search");
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export default function MatchPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [result, setResult] = useState(null);
  const [error,  setError]  = useState("");
  const [note,   setNote]   = useState("");
  const [loadingBooking, setLoadingBooking] = useState(null); // rideId being booked
  const [activeTrackingId, setActiveTrackingId] = useState(null);

  useEffect(() => {
    const search = location.state?.search || readSavedSearch();
    if (!search) { setError("Start with a search."); return; }
    searchRides(search)
      .then(setResult)
      .catch((err) => setError(err.message));
  }, [location.state]);

  async function book(rideId) {
    setNote("");
    setError("");
    setLoadingBooking(rideId);
    const search = location.state?.search || readSavedSearch() || {};
    try {
      await requestBooking({ ride_id: rideId, women_only: Boolean(search.women_only) });
      setNote("✅ Request sent! The driver will be notified and can accept it from My Rides.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingBooking(null);
    }
  }

  if (!result && !error) {
    return (
      <div style={{ textAlign: "center", padding: "60px 24px" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>🔍</div>
        <p className="muted">Finding matching student rides with AI KNN matching…</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 940, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 className="page-title" style={{ marginBottom: 4 }}>🎯 Smart Match Results</h1>
        {result && (
          <p className="muted" style={{ fontSize: "0.9rem" }}>
            {result.knn_used
              ? "Ranked with multi-criteria match score and K-Nearest Neighbors (KNN) recommendation."
              : "Ranked with pickup-drop closeness and departure time proximity."}
          </p>
        )}
      </div>

      {error && <div className="banner" style={{ background: "#fee2e2", color: "#dc2626", marginBottom: 16 }}>⚠️ {error}</div>}
      {note  && <div className="banner" style={{ background: "#dcfce7", color: "#16a34a", marginBottom: 16 }}>{note}</div>}

      {result && result.matches.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: "3rem", marginBottom: 12 }}>😕</div>
          <h2 style={{ marginBottom: 8 }}>No matching rides found</h2>
          <p className="muted" style={{ marginBottom: 20 }}>
            No open carpools matched your selected route and time on this date.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <Link className="btn" to="/find">🔍 Try Another Route or Date</Link>
            <Link className="btn secondary" to="/offer">🚗 Offer a Ride on this Route</Link>
          </div>
        </div>
      )}

      <div className="stack">
        {result &&
          result.matches.map((match) => {
            const isTracking = activeTrackingId === match.ride.id;
            const isOwnRide = user && user.id === match.ride.driver.id;
            const isUnverified = user && user.role === "student" && user.verification_status !== "verified";

            // Estimated savings vs auto
            const soloAutoEst = Math.round(match.ride.cost_per_seat * 2.2);
            const savings = Math.max(25, soloAutoEst - match.ride.cost_per_seat);

            return (
              <div key={match.ride.id} className="card" style={{ padding: 20 }}>
                <RideCard ride={match.ride} score={match.score} reasons={match.reasons}>
                  {/* Fare and Route details banner */}
                  <div
                    style={{
                      background: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      borderRadius: 8,
                      padding: "8px 12px",
                      marginTop: 10,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: "0.82rem",
                      flexWrap: "wrap",
                      gap: 6,
                    }}
                  >
                    <span style={{ color: "#166534", fontWeight: 600 }}>
                      💰 Fare: ₹{match.ride.cost_per_seat} per seat · Solo Auto Fare: ~₹{soloAutoEst}
                    </span>
                    <span style={{ color: "#15803d", fontWeight: 700 }}>
                      🎉 Save ~₹{savings} on this ride!
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap", alignItems: "center" }}>
                    {isOwnRide ? (
                      <Link to="/rides" className="btn sm secondary">
                        🚗 Your Offered Ride (Manage)
                      </Link>
                    ) : isUnverified ? (
                      <span className="muted" style={{ fontSize: "0.85rem" }}>
                        ⏳ Account verification pending to request seats.
                      </span>
                    ) : (
                      <button
                        className="btn sm"
                        type="button"
                        disabled={loadingBooking === match.ride.id}
                        onClick={() => book(match.ride.id)}
                      >
                        {loadingBooking === match.ride.id ? "Sending request…" : "🪑 Request Seat"}
                      </button>
                    )}

                    <button
                      className="btn secondary sm"
                      type="button"
                      onClick={() => setActiveTrackingId(isTracking ? null : match.ride.id)}
                    >
                      {isTracking ? "✕ Hide Map" : "🗺️ Live Route & Tracking"}
                    </button>
                  </div>
                </RideCard>

                {/* Live Route Map with real-time tracking */}
                {isTracking && (
                  <div style={{ marginTop: 14 }}>
                    <RideMap
                      pickup={match.ride.pickup}
                      drop={match.ride.drop}
                      liveTracking={true}
                      driverName={match.ride.driver.name}
                      height="300px"
                    />
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
