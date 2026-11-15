import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { requestBooking, searchRides } from "../api";
import RideCard from "../components/RideCard";
import RideMap from "../components/RideMap";

export default function MatchPage() {
  const location = useLocation();
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    const search = location.state?.search || readSavedSearch();
    if (!search) {
      setError("Start with a search.");
      return;
    }
    searchRides(search)
      .then(setResult)
      .catch((err) => setError(err.message));
  }, [location.state]);

  async function book(rideId) {
    setNote("");
    setError("");
    const search = location.state?.search || readSavedSearch() || {};
    try {
      await requestBooking({ ride_id: rideId, women_only: Boolean(search.women_only) });
      setNote("Request sent. The driver can accept or reject it from My Rides.");
    } catch (err) {
      setError(err.message);
    }
  }

  if (!result && !error) {
    return <p className="muted">Looking for matching rides...</p>;
  }

  return (
    <div>
      <h1>Smart match</h1>
      {result && (
        <p className="hint">
          {result.knn_used
            ? "Ranked with the match score and the KNN recommendation."
            : "Ranked with the match score. KNN needs at least two open rides."}
        </p>
      )}
      {error && <p className="error">{error}</p>}
      {note && <p className="success">{note}</p>}
      {result && result.matches.length === 0 && (
        <p>
          No open ride matched those filters. <Link to="/find">Search again</Link>
        </p>
      )}
      <div className="stack">
        {result &&
          result.matches.map((match) => (
            <div key={match.ride.id}>
              <RideCard ride={match.ride} score={match.score} reasons={match.reasons}>
                <button className="btn" type="button" onClick={() => book(match.ride.id)}>
                  Request seat
                </button>
              </RideCard>
              <RideMap pickup={match.ride.pickup} drop={match.ride.drop} />
            </div>
          ))}
      </div>
    </div>
  );
}

function readSavedSearch() {
  const raw = sessionStorage.getItem("jc_search");
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch (_error) {
    return null;
  }
}
