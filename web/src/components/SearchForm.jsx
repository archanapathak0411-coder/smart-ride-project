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
      .then((data) => setPlaces(data.places || []))
      .catch((err) => setError(err.message));
  }, []);

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submit(event) {
    event.preventDefault();
    setError("");
    if (!form.pickup_place_id || !form.drop_place_id) {
      setError("Please choose both Pickup (From) and Drop (To) locations.");
      return;
    }
    if (form.pickup_place_id === form.drop_place_id) {
      setError("Pickup and Drop must be different locations.");
      return;
    }

    const search = {
      ...form,
      women_only: Boolean(form.women_only),
      max_cost: form.max_cost === "" ? null : Number(form.max_cost),
    };
    sessionStorage.setItem("jc_search", JSON.stringify(search));

    if (!user) {
      navigate("/login", { state: { message: "Please log in to view and request matching rides." } });
      return;
    }

    navigate("/match", { state: { search } });
  }

  return (
    <form onSubmit={submit}>
      <div className="form-grid" style={{ gridTemplateColumns: compact ? "1fr" : undefined }}>
        <label className="field">
          <span>📍 From (Pickup)</span>
          <PlaceSelect
            places={places}
            value={form.pickup_place_id}
            onChange={(value) => update("pickup_place_id", value)}
            required
          />
        </label>
        <label className="field">
          <span>🏁 To (Destination)</span>
          <PlaceSelect
            places={places}
            value={form.drop_place_id}
            onChange={(value) => update("drop_place_id", value)}
            required
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
          <span>🕐 Preferred Time</span>
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
              <span>💰 Max Fare (₹)</span>
              <input
                type="number"
                min="0"
                placeholder="Optional budget"
                value={form.max_cost}
                onChange={(e) => update("max_cost", e.target.value)}
              />
            </label>
            <label className="check" style={{ alignSelf: "flex-end", paddingBottom: 8 }}>
              <input
                type="checkbox"
                checked={form.women_only}
                onChange={(e) => update("women_only", e.target.checked)}
              />
              <span>👩 Women-only rides</span>
            </label>
          </>
        )}
      </div>

      {error && <div className="banner" style={{ background: "#fee2e2", color: "#dc2626", marginTop: 12 }}>⚠️ {error}</div>}

      <button
        className="btn"
        type="submit"
        style={{ marginTop: 16, width: "100%", justifyContent: "center", padding: "12px", fontSize: "1rem" }}
      >
        🔍 Search Available Rides
      </button>
    </form>
  );
}
