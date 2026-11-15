import { useEffect, useState } from "react";
import {
  acceptBooking, cancelBooking, cancelRide, completeRide,
  createRating, getSavings, myBookings, myRides, rejectBooking,
} from "../api";
import RideCard from "../components/RideCard";
import { useAuth } from "../context/AuthContext";
import { rupee } from "../utils";

function rideGroup(status) {
  if (status === "cancelled") return "cancelled";
  if (status === "completed") return "completed";
  return "upcoming";
}
function bookingGroup(booking) {
  if (booking.status === "cancelled" || booking.status === "rejected") return "cancelled";
  if (booking.status === "completed" || booking.ride.status === "completed") return "completed";
  return "upcoming";
}

const TABS = ["upcoming", "completed", "cancelled"];

export default function MyRidesPage() {
  const { user, saveProfile } = useAuth();
  const [tab, setTab]         = useState("upcoming");
  const [offered, setOffered] = useState([]);
  const [joined, setJoined]   = useState([]);
  const [savings, setSavings] = useState(null);
  const [fare, setFare]       = useState(user?.typical_solo_fare || "");
  const [error, setError]     = useState("");
  const [ratingStars, setRatingStars]     = useState(5);
  const [ratingComment, setRatingComment] = useState("");

  async function load() {
    setError("");
    try {
      const [rideData, bookingData, savingsData] = await Promise.all([
        myRides(), myBookings(), getSavings(),
      ]);
      setOffered(rideData.rides);
      setJoined(bookingData.bookings);
      setSavings(savingsData);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => { load(); }, []);

  async function run(action) {
    setError("");
    try { await action(); await load(); }
    catch (err) { setError(err.message); }
  }

  const offeredVisible = offered.filter((r) => rideGroup(r.status) === tab);
  const joinedVisible  = joined.filter((b) => bookingGroup(b) === tab);

  return (
    <div className="content">
      <div className="page-header">
        <h1>🗂 My Rides</h1>
        <p>Track rides you've offered and trips you've joined.</p>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>⚠️ {error}</div>}

      {/* Savings card */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 12 }}>
          💸 Money Saved This Month
        </h2>
        {savings && savings.saved != null ? (
          <p className="savings-total">
            {rupee(savings.saved)} saved across {savings.trip_count}{" "}
            shared {savings.trip_count === 1 ? "trip" : "trips"}
          </p>
        ) : (
          <p className="muted">Set what you usually pay to travel alone. Savings = that amount minus the share.</p>
        )}

        <form
          className="form-row"
          style={{ marginTop: 12 }}
          onSubmit={(e) => {
            e.preventDefault();
            run(() => saveProfile({ typical_solo_fare: fare === "" ? null : Number(fare) }).then(load));
          }}
        >
          <label className="field" style={{ flex: 1, maxWidth: 240 }}>
            <span>Usual solo fare (₹)</span>
            <input
              type="number"
              min="0"
              value={fare}
              onChange={(e) => setFare(e.target.value)}
            />
          </label>
          <button className="btn btn-dark btn-sm" type="submit" style={{ alignSelf: "flex-end" }}>
            Save
          </button>
        </form>

        {savings && savings.trips.length > 0 && (
          <ul className="reasons" style={{ marginTop: 12 }}>
            {savings.trips.map((trip) => (
              <li key={trip.booking_id}>
                {trip.ride_date}: {trip.pickup} → {trip.drop} · paid {rupee(trip.cost_per_seat)}
                {trip.saved != null ? " · saved " + rupee(trip.saved) : ""}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs">
        {TABS.map((name) => (
          <button
            key={name}
            className={"tab" + (tab === name ? " active" : "")}
            type="button"
            onClick={() => setTab(name)}
          >
            {name === "upcoming" ? "🚗 Upcoming" : name === "completed" ? "✅ Completed" : "❌ Cancelled"}
          </button>
        ))}
      </div>

      {/* Rides I offered */}
      <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 12 }}>Rides I Offered</h2>
      <div className="stack">
        {offeredVisible.length === 0 && (
          <p className="muted">Nothing in this tab.</p>
        )}
        {offeredVisible.map((ride) => (
          <RideCard key={ride.id} ride={ride}>
            <div className="form-row" style={{ marginTop: 10 }}>
              {(ride.status === "open" || ride.status === "full") && (
                <>
                  <button
                    className="btn btn-ghost btn-sm"
                    type="button"
                    onClick={() => run(() => cancelRide(ride.id))}
                  >
                    Cancel ride
                  </button>
                  <button
                    className="btn btn-dark btn-sm"
                    type="button"
                    onClick={() => run(() => completeRide(ride.id))}
                  >
                    ✅ Mark completed
                  </button>
                </>
              )}
            </div>
            {ride.bookings.length > 0 && (
              <ul className="requests">
                {ride.bookings.map((booking) => (
                  <li key={booking.id}>
                    <span>{booking.passenger.name}</span>
                    {" · "}
                    <span className={"pill pill-" + booking.status}>{booking.status}</span>
                    {booking.status === "pending" && (
                      <span style={{ marginLeft: 8 }}>
                        <button
                          className="btn btn-primary btn-sm"
                          style={{ marginRight: 6 }}
                          type="button"
                          onClick={() => run(() => acceptBooking(booking.id))}
                        >
                          Accept
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          type="button"
                          onClick={() => run(() => rejectBooking(booking.id))}
                        >
                          Reject
                        </button>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </RideCard>
        ))}
      </div>

      {/* Rides I joined */}
      <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "28px 0 12px" }}>Rides I Joined</h2>
      <div className="stack">
        {joinedVisible.length === 0 && (
          <p className="muted">Nothing in this tab.</p>
        )}
        {joinedVisible.map((booking) => (
          <RideCard key={booking.id} ride={booking.ride}>
            <div style={{ marginTop: 8 }}>
              <span>Your request is </span>
              <span className={"pill pill-" + booking.status}>{booking.status}</span>
            </div>
            {(booking.status === "pending" || booking.status === "accepted") &&
              booking.ride.status !== "completed" &&
              booking.ride.status !== "cancelled" && (
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ marginTop: 10 }}
                  type="button"
                  onClick={() => run(() => cancelBooking(booking.id))}
                >
                  Cancel request
                </button>
              )}
            {booking.can_rate && (
              <form
                className="stack"
                style={{ marginTop: 12, padding: 16, background: "var(--paper)", borderRadius: 10 }}
                onSubmit={(e) => {
                  e.preventDefault();
                  run(() => createRating({ booking_id: booking.id, stars: Number(ratingStars), comment: ratingComment }));
                }}
              >
                <p style={{ fontWeight: 600, fontSize: "0.88rem" }}>⭐ Rate this ride</p>
                <div className="form-row">
                  <label className="field" style={{ flex: "0 0 120px" }}>
                    <span>Stars (1–5)</span>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={ratingStars}
                      onChange={(e) => setRatingStars(e.target.value)}
                    />
                  </label>
                  <label className="field" style={{ flex: 1 }}>
                    <span>Comment</span>
                    <input
                      value={ratingComment}
                      onChange={(e) => setRatingComment(e.target.value)}
                    />
                  </label>
                </div>
                <button className="btn btn-primary btn-sm" type="submit">Submit Rating</button>
              </form>
            )}
            {booking.my_rating && (
              <p className="muted" style={{ marginTop: 8 }}>
                ⭐ You rated this {booking.my_rating} stars.
              </p>
            )}
          </RideCard>
        ))}
      </div>
    </div>
  );
}
