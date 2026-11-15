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
    <form className={compact ? "card search-form" : "card form"} onSubmit={submit}>
      {!compact && <h2>Find a ride</h2>}
      <div className="form-grid">
        <PlaceSelect
          label="Pickup"
          places={places}
          value={form.pickup_place_id}
          onChange={(value) => update("pickup_place_id", value)}
        />
        <PlaceSelect
          label="Drop"
          places={places}
          value={form.drop_place_id}
          onChange={(value) => update("drop_place_id", value)}
        />
        <label className="field">
          <span>Date</span>
          <input
            type="date"
            value={form.ride_date}
            onChange={(event) => update("ride_date", event.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>Time</span>
          <input
            type="time"
            value={form.ride_time}
            onChange={(event) => update("ride_time", event.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>Max share amount</span>
          <input
            type="number"
            min="0"
            placeholder="Optional"
            value={form.max_cost}
            onChange={(event) => update("max_cost", event.target.value)}
          />
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={form.women_only}
            onChange={(event) => update("women_only", event.target.checked)}
          />
          <span>Show women-only rides only</span>
        </label>
      </div>
      <p className="hint">
        Women-only rides appear only when this box is ticked. Other rides stay hidden while it is ticked.
      </p>
      {error && <p className="error">{error}</p>}
      <button className="btn" type="submit">
        Find rides
      </button>
    </form>
  );
}
