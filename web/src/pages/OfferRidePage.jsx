import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getPlaces, createRide, calculateFare } from "../api";
import PlaceSelect from "../components/PlaceSelect";
import RideMap from "../components/RideMap";
import { useAuth } from "../context/AuthContext";
import { todayInput } from "../utils";

export default function OfferRidePage() {
  const { user } = useAuth();
  const [places, setPlaces] = useState([]);
  const [form, setForm] = useState({
    pickup_place_id: "",
    drop_place_id: "",
    ride_date: todayInput(),
    ride_time: "08:31",
    seats_total: 3,
    cost_per_seat: 40,
    women_only: false,
  });
  const [fareCalc, setFareCalc] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getPlaces()
      .then((data) => setPlaces(data.places || []))
      .catch((err) => setError(err.message));
  }, []);

  const pickup = places.find((p) => String(p.id) === String(form.pickup_place_id));
  const drop   = places.find((p) => String(p.id) === String(form.drop_place_id));

  const isStudent = user && user.role === "student";
  const isUnverified = isStudent && user.verification_status !== "verified";

  // Re-calculate fare whenever pickup or drop changes
  useEffect(() => {
    if (form.pickup_place_id && form.drop_place_id && form.pickup_place_id !== form.drop_place_id) {
      calculateFare({ pickup_place_id: form.pickup_place_id, drop_place_id: form.drop_place_id })
        .then((res) => {
          setFareCalc(res);
          if (res.recommended_fare) {
            setForm((f) => ({ ...f, cost_per_seat: res.recommended_fare }));
          }
        })
        .catch(() => setFareCalc(null));
    } else {
      setFareCalc(null);
    }
  }, [form.pickup_place_id, form.drop_place_id]);

  function update(key, value) {
    setForm((c) => ({ ...c, [key]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!form.pickup_place_id || !form.drop_place_id) {
      setError("Please select both Pickup and Drop locations.");
      return;
    }
    if (form.pickup_place_id === form.drop_place_id) {
      setError("Pickup and Drop locations must be different places.");
      return;
    }

    setLoading(true);
    try {
      const data = await createRide({
        ...form,
        seats_total: Number(form.seats_total),
        cost_per_seat: Number(form.cost_per_seat),
        women_only: Boolean(form.women_only),
      });
      setMessage("✅ Ride successfully published from " + data.ride.pickup.name + " to " + data.ride.drop.name + "!");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 840, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 className="page-title" style={{ marginBottom: 4 }}>🚗 Offer a Campus Ride</h1>
        <p className="muted" style={{ fontSize: "0.9rem" }}>
          Share your vehicle seats with campus peers. Automatic fair pricing calculates recommended student fuel share.
        </p>
      </div>

      {isUnverified && (
        <div className="banner" style={{ background: "#fffbeb", color: "#92400e", marginBottom: 20 }}>
          ⏳ Your account status is <b>{user.verification_status}</b>. Offering rides requires verified status.
          {" "}
          <Link to="/login" style={{ fontWeight: 700, color: "var(--blue)" }}>Check status / upload ID</Link>
          {user.role === "admin" && <span> or verify in <Link to="/admin">Admin Dashboard</Link></span>}
        </div>
      )}

      <div className="card">
        <form className="stack" onSubmit={submit}>
          <div className="form-grid">
            <label className="field">
              <span>📍 Pickup Location</span>
              <PlaceSelect
                places={places}
                value={form.pickup_place_id}
                onChange={(v) => update("pickup_place_id", v)}
                required
              />
            </label>
            <label className="field">
              <span>🏁 Drop Location</span>
              <PlaceSelect
                places={places}
                value={form.drop_place_id}
                onChange={(v) => update("drop_place_id", v)}
                required
              />
            </label>
            <label className="field">
              <span>📅 Ride Date</span>
              <input
                type="date"
                value={form.ride_date}
                onChange={(e) => update("ride_date", e.target.value)}
                required
              />
            </label>
            <label className="field">
              <span>🕐 Departure Time</span>
              <input
                type="time"
                value={form.ride_time}
                onChange={(e) => update("ride_time", e.target.value)}
                required
              />
            </label>
            <label className="field">
              <span>💺 Available Seats</span>
              <input
                type="number"
                min="1"
                max="6"
                value={form.seats_total}
                onChange={(e) => update("seats_total", e.target.value)}
                required
              />
            </label>
            <label className="field">
              <span>💰 Fuel Share / Seat (₹)</span>
              <input
                type="number"
                min="0"
                value={form.cost_per_seat}
                onChange={(e) => update("cost_per_seat", e.target.value)}
                required
              />
            </label>
          </div>

          {/* Fare Calculation & Route Breakdown Info Box */}
          {fareCalc && (
            <div
              style={{
                background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
                border: "1.5px solid #93c5fd",
                borderRadius: 12,
                padding: "16px 20px",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700, color: "#1e40af", fontSize: "0.95rem" }}>
                  💡 Automatic Fare Calculator: ₹{fareCalc.recommended_fare} per seat
                </span>
                <span style={{ fontSize: "0.82rem", background: "#3b82f6", color: "white", padding: "2px 8px", borderRadius: 999 }}>
                  {fareCalc.road_distance_km} km · ~{fareCalc.estimated_duration_mins} mins
                </span>
              </div>
              <div style={{ fontSize: "0.85rem", color: "#1e3a8a", display: "flex", gap: 16, flexWrap: "wrap" }}>
                <span>Suggested Range: ₹{fareCalc.fare_range.min} – ₹{fareCalc.fare_range.max}</span>
                <span>Solo Auto Fare: ₹{fareCalc.solo_auto_fare}</span>
                <span>Solo Cab Fare: ₹{fareCalc.solo_cab_fare}</span>
                <span style={{ fontWeight: 700, color: "#15803d" }}>
                  Each student saves ~₹{fareCalc.savings_vs_auto} vs solo travel!
                </span>
              </div>
            </div>
          )}

          <label className="check">
            <input
              type="checkbox"
              checked={form.women_only}
              onChange={(e) => update("women_only", e.target.checked)}
            />
            <span>👩 Women-only ride preference</span>
          </label>

          {/* Interactive Route Map Preview */}
          <RideMap pickup={pickup} drop={drop} height="280px" />

          {error   && <div className="banner" style={{ background: "#fee2e2", color: "#dc2626" }}>⚠️ {error}</div>}
          {message && <div className="banner" style={{ background: "#dcfce7", color: "#16a34a" }}>{message}</div>}

          <button
            className="btn"
            type="submit"
            disabled={isUnverified || loading}
            style={{ justifyContent: "center", padding: "12px", fontSize: "1rem" }}
          >
            {loading ? "Posting ride…" : "🚀 Publish Ride"}
          </button>
        </form>
      </div>
    </div>
  );
}
