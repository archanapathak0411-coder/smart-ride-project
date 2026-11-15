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

  useEffect(() => {
    getPlaces().then((data) => setPlaces(data.places)).catch((err) => setError(err.message));
  }, []);

  const pickup = places.find((place) => String(place.id) === String(form.pickup_place_id));
  const drop = places.find((place) => String(place.id) === String(form.drop_place_id));
  const blocked = user && user.role === "student" && user.verification_status !== "verified";

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      const data = await createRide({
        ...form,
        seats_total: Number(form.seats_total),
        cost_per_seat: Number(form.cost_per_seat),
        women_only: Boolean(form.women_only),
      });
      setMessage("Ride offered from " + data.ride.pickup.name + " to " + data.ride.drop.name + ".");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form className="card form" onSubmit={submit}>
      <h1>Offer a ride</h1>
      <p className="hint">Add the empty seats in your vehicle. Passengers will see a match score.</p>
      {blocked && <p className="banner">Wait for admin verification before offering a ride.</p>}
      <div className="form-grid">
        <PlaceSelect label="Pickup" places={places} value={form.pickup_place_id} onChange={(value) => update("pickup_place_id", value)} />
        <PlaceSelect label="Drop" places={places} value={form.drop_place_id} onChange={(value) => update("drop_place_id", value)} />
        <label className="field">
          <span>Date</span>
          <input type="date" value={form.ride_date} onChange={(event) => update("ride_date", event.target.value)} required />
        </label>
        <label className="field">
          <span>Time</span>
          <input type="time" value={form.ride_time} onChange={(event) => update("ride_time", event.target.value)} required />
        </label>
        <label className="field">
          <span>Seats</span>
          <input type="number" min="1" max="6" value={form.seats_total} onChange={(event) => update("seats_total", event.target.value)} required />
        </label>
        <label className="field">
          <span>Cost per seat (₹)</span>
          <input type="number" min="0" value={form.cost_per_seat} onChange={(event) => update("cost_per_seat", event.target.value)} required />
        </label>
        <label className="check">
          <input type="checkbox" checked={form.women_only} onChange={(event) => update("women_only", event.target.checked)} />
          <span>Women-only ride</span>
        </label>
      </div>
      <p className="hint">Only passengers who tick women-only on the search form can see this ride.</p>
      <RideMap pickup={pickup} drop={drop} />
      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}
      <button className="btn" type="submit" disabled={blocked}>
        Offer ride
      </button>
    </form>
  );
}
