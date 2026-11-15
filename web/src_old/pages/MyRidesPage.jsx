import { useEffect, useState } from "react";
import {
  acceptBooking,
  cancelBooking,
  cancelRide,
  completeRide,
  createRating,
  getSavings,
  myBookings,
  myRides,
  rejectBooking,
} from "../api";
import RideCard from "../components/RideCard";
import { useAuth } from "../context/AuthContext";
import { rupee } from "../utils";

export default function MyRidesPage() {
  const { user, saveProfile } = useAuth();
  const [tab, setTab] = useState("upcoming");
  const [offered, setOffered] = useState([]);
  const [joined, setJoined] = useState([]);
  const [savings, setSavings] = useState(null);
  const [fare, setFare] = useState(user?.typical_solo_fare || "");
  const [error, setError] = useState("");
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState("");

  async function load() {
    setError("");
    try {
      const [rideData, bookingData, savingsData] = await Promise.all([
        myRides(),
        myBookings(),
        getSavings(),
      ]);
      setOffered(rideData.rides);
      setJoined(bookingData.bookings);
      setSavings(savingsData);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function run(action) {
    setError("");
    try {
      await action();
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  const offeredVisible = offered.filter((ride) => rideGroup(ride.status) === tab);
  const joinedVisible = joined.filter((booking) => bookingGroup(booking) === tab);

  return (
    <div>
      <h1>My rides</h1>
      <section className="card">
        <h2>Money saved this month</h2>
        {savings && savings.saved != null ? (
          <p className="savings-total">
            {rupee(savings.saved)} saved across {savings.trip_count} shared{" "}
            {savings.trip_count === 1 ? "trip" : "trips"}.
          </p>
        ) : (
          <p>Set what you usually pay to travel alone. Savings = that amount minus the share.</p>
        )}
        <form
          className="inline"
          onSubmit={(event) => {
            event.preventDefault();
            run(() => saveProfile({ typical_solo_fare: fare === "" ? null : Number(fare) }).then(load));
          }}
        >
          <label className="field">
            <span>Usual solo fare (₹)</span>
            <input type="number" min="0" value={fare} onChange={(event) => setFare(event.target.value)} />
          </label>
          <button className="btn" type="submit">
            Save
          </button>
        </form>
        {savings && savings.trips.length > 0 && (
          <ul className="reasons">
            {savings.trips.map((trip) => (
              <li key={trip.booking_id}>
                {trip.ride_date}: {trip.pickup} to {trip.drop} · paid {rupee(trip.cost_per_seat)}
                {trip.saved != null ? " · saved " + rupee(trip.saved) : ""}
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="tabs">
        {["upcoming", "completed", "cancelled"].map((name) => (
          <button key={name} className={tab === name ? "tab active" : "tab"} type="button" onClick={() => setTab(name)}>
            {name}
          </button>
        ))}
      </div>
      {error && <p className="error">{error}</p>}

      <h2>Rides I offered</h2>
      <div className="stack">
        {offeredVisible.length === 0 && <p className="muted">Nothing in this list.</p>}
        {offeredVisible.map((ride) => (
          <RideCard key={ride.id} ride={ride}>
            <div className="row">
              {(ride.status === "open" || ride.status === "full") && (
                <>
                  <button className="btn secondary" type="button" onClick={() => run(() => cancelRide(ride.id))}>
                    Cancel ride
                  </button>
                  <button className="btn" type="button" onClick={() => run(() => completeRide(ride.id))}>
                    Mark completed
                  </button>
                </>
              )}
            </div>
            <ul className="requests">
              {ride.bookings.map((booking) => (
                <li key={booking.id}>
                  {booking.passenger.name} · {booking.status}
                  {booking.status === "pending" && (
                    <span className="row">
                      <button className="btn tiny" type="button" onClick={() => run(() => acceptBooking(booking.id))}>
                        Accept
                      </button>
                      <button className="btn tiny secondary" type="button" onClick={() => run(() => rejectBooking(booking.id))}>
                        Reject
                      </button>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </RideCard>
        ))}
      </div>

      <h2>Rides I joined</h2>
      <div className="stack">
        {joinedVisible.length === 0 && <p className="muted">Nothing in this list.</p>}
        {joinedVisible.map((booking) => (
          <RideCard key={booking.id} ride={booking.ride}>
            <p>Your request is {booking.status}.</p>
            {(booking.status === "pending" || booking.status === "accepted") &&
              booking.ride.status !== "completed" &&
              booking.ride.status !== "cancelled" && (
                <button className="btn secondary" type="button" onClick={() => run(() => cancelBooking(booking.id))}>
                  Cancel request
                </button>
              )}
            {booking.can_rate && (
              <form
                className="inline"
                onSubmit={(event) => {
                  event.preventDefault();
                  run(() => createRating({ booking_id: booking.id, stars: Number(stars), comment }));
                }}
              >
                <label className="field">
                  <span>Stars</span>
                  <input type="number" min="1" max="5" value={stars} onChange={(event) => setStars(event.target.value)} />
                </label>
                <label className="field">
                  <span>Comment</span>
                  <input value={comment} onChange={(event) => setComment(event.target.value)} />
                </label>
                <button className="btn" type="submit">
                  Rate ride
                </button>
              </form>
            )}
            {booking.my_rating && <p>You rated this {booking.my_rating} stars.</p>}
          </RideCard>
        ))}
      </div>
    </div>
  );
}

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
