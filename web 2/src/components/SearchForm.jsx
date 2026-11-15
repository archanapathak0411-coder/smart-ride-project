import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPlaces } from "../api";
import PlaceSelect from "./PlaceSelect";
import { useAuth } from "../context/AuthContext";
import { todayInput } from "../utils";

const emptySearch = {
  pickup_place_id: "",
  drop_place_id: "",
  ride_date: todayInput(),
  ride_time: "08:30",
  women_only: false,
  max_cost: "",
};

export default function SearchForm({ compact = false }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [places, setPlaces] = useState([]);
  const [form, setForm] = useState({
    ...emptySearch,
    women_only: Boolean(user && user.women_only_preference),
  });
  const [error, setError] = useState("");

  useEffect(() => {
    getPlaces()
      .then((data) => setPlaces(data.places))
      .catch((err) => setError(err.message));
  }, []);

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submit(event) {
    event.preventDefault();
    setError("");
    if (!form.pickup_place_id || !form.drop_place_id) {
      setError("Choose a pickup and a drop.");
      return;
    }
    if (form.pickup_place_id === form.drop_place_id) {
      setError("Pickup and drop must be different places.");
      return;
    }
    if (!user) {
      navigate("/login", { state: { message: "Log in to search for a ride." } });
      return;
    }
    const search = {
      ...form,
      women_only: Boolean(form.women_only),
      max_cost: form.max_cost === "" ? null : Number(form.max_cost),
    };
    sessionStorage.setItem("jc_search", JSON.stringify(search));
    navigate("/match", { state: { search } });
  }

  return (
    <form onSubmit={submit}>
      <div className="form-grid" style={{ gridTemplateColumns: compact ? "1fr" : undefined }}>
        <label className="field">
          <span>📍 From</span>
          <PlaceSelect
            label="Pickup"
            places={places}
            value={form.pickup_place_id}
            onChange={(value) => update("pickup_place_id", value)}
          />
        </label>
        <label className="field">
          <span>🏁 To</span>
          <PlaceSelect
            label="Drop"
            places={places}
            value={form.drop_place_id}
            onChange={(value) => update("drop_place_id", value)}
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
        {!compact && (
          <>
            <label className="field">
              <span>💰 Max share amount (₹)</span>
              <input
                type="number"
                min="0"
                placeholder="Optional"
                value={form.max_cost}
                onChange={(e) => update("max_cost", e.target.value)}
              />
            </label>
            <label className="check" style={{ alignSelf: "flex-end", paddingBottom: 4 }}>
              <input
                type="checkbox"
                checked={form.women_only}
                onChange={(e) => update("women_only", e.target.checked)}
              />
              <span>👩 Women-only rides only</span>
            </label>
          </>
        )}
      </div>

      {error && <p className="error" style={{ marginTop: 10 }}>{error}</p>}

      <button
        className="btn btn-primary"
        type="submit"
        style={{ marginTop: 16, width: "100%", justifyContent: "center" }}
      >
        🔍 Search Ride
      </button>
    </form>
  );
}
