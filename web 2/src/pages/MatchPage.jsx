import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { requestBooking, searchRides } from "../api";
import RideCard from "../components/RideCard";
import RideMap from "../components/RideMap";

function readSavedSearch() {
  const raw = sessionStorage.getItem("jc_search");
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export default function MatchPage() {
  const location = useLocation();
  const [result, setResult] = useState(null);
  const [error,  setError]  = useState("");
  const [note,   setNote]   = useState("");

  useEffect(() => {
    const search = location.state?.search || readSavedSearch();
    if (!search) { setError("Start with a search."); return; }
    searchRides(search)
      .then(setResult)
      .catch((err) => setError(err.message));
  }, [location.state]);

  async function book(rideId) {
    setNote(""); setError("");
    const search = location.state?.search || readSavedSearch() || {};
    try {
      await requestBooking({ ride_id: rideId, women_only: Boolean(search.women_only) });
      setNote("✅ Request sent! The driver can accept or reject it from My Rides.");
    } catch (err) {
      setError(err.message);
    }
  }

  if (!result && !error) {
    return (
      <div className="content" style={{ textAlign: "center", padding: "60px 24px" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>🔍</div>
        <p className="muted">Looking for matching rides…</p>
      </div>
    );
  }

  return (
    <div className="content">
      <div className="page-header">
        <h1>🎯 Smart Match Results</h1>
        {result && (
          <p>
            {result.knn_used
              ? "Ranked with the match score and the KNN recommendation."
              : "Ranked with the match score. KNN needs at least two open rides."}
          </p>
        )}
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>⚠️ {error}</div>}
      {note  && <div className="alert alert-success" style={{ marginBottom: 16 }}>{note}</div>}

      {result && result.matches.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: "3rem", marginBottom: 12 }}>😕</div>
          <h2 style={{ marginBottom: 8 }}>No rides found</h2>
          <p className="muted" style={{ marginBottom: 20 }}>
            No open ride matched those filters.
          </p>
          <Link className="btn btn-primary" to="/find">🔍 Search Again</Link>
        </div>
      )}

      <div className="stack">
        {result &&
          result.matches.map((match) => (
            <div key={match.ride.id}>
              <RideCard ride={match.ride} score={match.score} reasons={match.reasons}>
                <div style={{ marginTop: 12 }}>
                  <button
                    className="btn btn-primary btn-sm"
                    type="button"
                    onClick={() => book(match.ride.id)}
                  >
                    🪑 Request Seat
                  </button>
                </div>
              </RideCard>
              <div className="map-frame" style={{ marginTop: 0 }}>
                <RideMap pickup={match.ride.pickup} drop={match.ride.drop} />
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
