import { useEffect, useState } from "react";
import { getPlaces, createRide } from "../api";
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
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getPlaces()
      .then((data) => setPlaces(data.places))
      .catch((err) => setError(err.message));
  }, []);

  const pickup = places.find((p) => String(p.id) === String(form.pickup_place_id));
  const drop   = places.find((p) => String(p.id) === String(form.drop_place_id));
  const blocked = user && user.role === "student" && user.verification_status !== "verified";

  function update(key, value) {
    setForm((c) => ({ ...c, [key]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setMessage(""); setError(""); setLoading(true);
    try {
      const data = await createRide({
        ...form,
        seats_total: Number(form.seats_total),
        cost_per_seat: Number(form.cost_per_seat),
        women_only: Boolean(form.women_only),
      });
      setMessage("✅ Ride offered from " + data.ride.pickup.name + " to " + data.ride.drop.name + "!");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="content">
      <div className="page-header">
        <h1>🚗 Offer a Ride</h1>
        <p>Add the empty seats in your vehicle. Passengers will see a smart match score.</p>
      </div>

      {blocked && (
        <div className="alert alert-warning" style={{ marginBottom: 20 }}>
          ⏳ Wait for admin verification before offering a ride.
        </div>
      )}

      <div className="card">
        <form className="stack" onSubmit={submit}>
          <div className="form-grid">
            <label className="field">
              <span>📍 Pickup</span>
              <PlaceSelect
                label="Pickup"
                places={places}
                value={form.pickup_place_id}
                onChange={(v) => update("pickup_place_id", v)}
              />
            </label>
            <label className="field">
              <span>🏁 Drop</span>
              <PlaceSelect
                label="Drop"
                places={places}
                value={form.drop_place_id}
                onChange={(v) => update("drop_place_id", v)}
              />
            </label>
            <label className="field">
              <span>📅 Date</span>
              <input
                type="date"
                value={form.ride_date}
                onChange={(e) => update("ride_date", e.target.value)}
                required
              />
            </label>
            <label className="field">
              <span>🕐 Time</span>
              <input
                type="time"
                value={form.ride_time}
                onChange={(e) => update("ride_time", e.target.value)}
                required
              />
            </label>
            <label className="field">
              <span>💺 Seats available</span>
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
              <span>💰 Cost per seat (₹)</span>
              <input
                type="number"
                min="0"
                value={form.cost_per_seat}
                onChange={(e) => update("cost_per_seat", e.target.value)}
                required
              />
            </label>
          </div>

          <label className="check">
            <input
              type="checkbox"
              checked={form.women_only}
              onChange={(e) => update("women_only", e.target.checked)}
            />
            <span>👩 Women-only ride</span>
          </label>
          <p className="hint">Only passengers who tick women-only on the search form can see this ride.</p>

          <RideMap pickup={pickup} drop={drop} />

          {error   && <div className="alert alert-error">⚠️ {error}</div>}
          {message && <div className="alert alert-success">{message}</div>}

          <button
            className="btn btn-primary"
            type="submit"
            disabled={blocked || loading}
            style={{ justifyContent: "center" }}
          >
            {loading ? "Posting ride…" : "🚗 Offer Ride"}
          </button>
        </form>
      </div>
    </div>
  );
}
