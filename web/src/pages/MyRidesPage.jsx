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
  updateRide,
} from "../api";
import RideCard from "../components/RideCard";
import RideMap from "../components/RideMap";
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
  const [tab, setTab] = useState("upcoming");
  const [offered, setOffered] = useState([]);
  const [joined, setJoined] = useState([]);
  const [savings, setSavings] = useState(null);
  const [fare, setFare] = useState(user?.typical_solo_fare || "");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [ratingStars, setRatingStars] = useState(5);
  const [ratingComment, setRatingComment] = useState("");

  // Live Tracking state
  const [activeTrackingRide, setActiveTrackingRide] = useState(null); // ride object to track

  // Edit Ride state
  const [editRideModal, setEditRideModal] = useState(null); // ride object to edit
  const [editForm, setEditForm] = useState({ seats_total: 3, cost_per_seat: 40, ride_time: "08:30" });

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

  async function run(action, msg = "") {
    setError("");
    setSuccess("");
    try {
      await action();
      if (msg) {
        setSuccess(msg);
        setTimeout(() => setSuccess(""), 4000);
      }
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  function openEditModal(ride) {
    setEditRideModal(ride);
    setEditForm({
      seats_total: ride.seats_total,
      cost_per_seat: ride.cost_per_seat,
      ride_time: ride.ride_time,
    });
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    if (!editRideModal) return;
    try {
      await updateRide(editRideModal.id, editForm);
      setSuccess("✅ Ride details updated successfully!");
      setEditRideModal(null);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  const offeredVisible = offered.filter((r) => rideGroup(r.status) === tab);
  const joinedVisible = joined.filter((b) => bookingGroup(b) === tab);

  return (
    <div style={{ maxWidth: 980, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 className="page-title" style={{ marginBottom: 4 }}>🗂 My Rides &amp; Passenger Dashboard</h1>
        <p className="muted" style={{ fontSize: "0.9rem" }}>
          Manage your offered carpools, view passenger requests, track live routes, and view savings.
        </p>
      </div>

      {error && <div className="banner" style={{ background: "#fee2e2", color: "#dc2626", marginBottom: 16 }}>⚠️ {error}</div>}
      {success && <div className="banner" style={{ background: "#dcfce7", color: "#16a34a", marginBottom: 16 }}>{success}</div>}

      {/* Savings & Solo Fare Card */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: 4 }}>
              💸 Money Saved on Campus Commute
            </h2>
            {savings && savings.saved != null ? (
              <p className="savings-total" style={{ color: "#16a34a", fontWeight: 800, fontSize: "1.3rem" }}>
                {rupee(savings.saved)} saved across {savings.trip_count}{" "}
                shared {savings.trip_count === 1 ? "trip" : "trips"}!
              </p>
            ) : (
              <p className="muted" style={{ fontSize: "0.85rem" }}>
                Set what you usually pay for solo auto/cab travel to compute your exact savings.
              </p>
            )}
          </div>

          <form
            style={{ display: "flex", gap: 8, alignItems: "flex-end" }}
            onSubmit={(e) => {
              e.preventDefault();
              run(() => saveProfile({ typical_solo_fare: fare === "" ? null : Number(fare) }).then(load), "Saved typical solo fare");
            }}
          >
            <label className="field" style={{ minWidth: 160 }}>
              <span style={{ fontSize: "0.8rem" }}>Usual Solo Fare (₹)</span>
              <input
                type="number"
                min="0"
                value={fare}
                onChange={(e) => setFare(e.target.value)}
                placeholder="e.g. 100"
                style={{ padding: "8px 10px" }}
              />
            </label>
            <button className="btn sm" type="submit">
              Save
            </button>
          </form>
        </div>

        {savings && savings.trips.length > 0 && (
          <div style={{ marginTop: 12, borderTop: "1px solid var(--line)", paddingTop: 10 }}>
            <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--muted)", marginBottom: 4 }}>Recent Shared Trips:</div>
            <ul className="reasons" style={{ fontSize: "0.82rem", color: "#475569" }}>
              {savings.trips.map((trip) => (
                <li key={trip.booking_id}>
                  {trip.ride_date}: {trip.pickup} → {trip.drop} · Paid {rupee(trip.cost_per_seat)}
                  {trip.saved != null ? " · Saved " + rupee(trip.saved) : ""}
                </li>
              ))}
            </ul>
          </div>
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
            {name === "upcoming" ? "🚗 Upcoming Rides" : name === "completed" ? "✅ Completed Trips" : "❌ Cancelled"}
          </button>
        ))}
      </div>

      {/* ── Section: Rides I Offered (Driver View) ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "24px 0 12px" }}>
        <h2 style={{ fontSize: "1.15rem", fontWeight: 700 }}>🚗 Rides I Offered (Driver)</h2>
        <span className="muted" style={{ fontSize: "0.85rem" }}>{offeredVisible.length} ride(s)</span>
      </div>

      <div className="stack">
        {offeredVisible.length === 0 && (
          <div className="card" style={{ padding: 24, textAlign: "center", color: "var(--muted)" }}>
            No offered rides in this tab.
          </div>
        )}

        {offeredVisible.map((ride) => {
          const isTracking = activeTrackingRide?.id === ride.id;
          return (
            <div key={ride.id} className="card" style={{ padding: 20 }}>
              <RideCard ride={ride}>
                {/* Driver Controls */}
                <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap", alignItems: "center" }}>
                  {(ride.status === "open" || ride.status === "full") && (
                    <>
                      <button
                        className="btn sm"
                        style={{ background: "#2563eb" }}
                        type="button"
                        onClick={() => openEditModal(ride)}
                      >
                        ✏️ Edit Ride Details
                      </button>
                      <button
                        className="btn sm"
                        style={{ background: "#16a34a" }}
                        type="button"
                        onClick={() => run(() => completeRide(ride.id), "Ride marked completed")}
                      >
                        ✅ Mark Completed
                      </button>
                      <button
                        className="btn sm danger"
                        type="button"
                        onClick={() => run(() => cancelRide(ride.id), "Ride cancelled")}
                      >
                        Cancel Ride
                      </button>
                    </>
                  )}
                  <button
                    className="btn secondary sm"
                    type="button"
                    onClick={() => setActiveTrackingRide(isTracking ? null : ride)}
                  >
                    {isTracking ? "✕ Hide Map" : "🗺️ Live Route & GPS Tracking"}
                  </button>
                </div>

                {/* Passengers List under Driver Ride */}
                <div style={{ marginTop: 16, borderTop: "1px solid var(--line)", paddingTop: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>
                      👥 Passengers &amp; Bookings ({ride.bookings?.length || 0})
                    </span>
                  </div>

                  {ride.bookings && ride.bookings.length === 0 && (
                    <div className="muted" style={{ fontSize: "0.82rem" }}>
                      No passenger requests yet for this ride.
                    </div>
                  )}

                  {ride.bookings && ride.bookings.map((booking) => (
                    <div
                      key={booking.id}
                      style={{
                        background: "#f8fafc",
                        border: "1px solid var(--line)",
                        borderRadius: 8,
                        padding: "10px 14px",
                        margin: "6px 0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 8,
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>
                          {booking.passenger.name}
                        </div>
                        <div className="muted" style={{ fontSize: "0.8rem" }}>
                          Roll: <b>{booking.passenger.student_id || "N/A"}</b> · {booking.passenger.branch || "Student"}
                          {booking.passenger.phone && (
                            <> · 📞 <a href={`tel:${booking.passenger.phone}`} style={{ color: "var(--blue)" }}>{booking.passenger.phone}</a></>
                          )}
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span
                          className={
                            "badge-status " +
                            (booking.status === "accepted" ? "accepted" : booking.status === "rejected" ? "rejected" : "pending")
                          }
                        >
                          {booking.status.toUpperCase()}
                        </span>

                        {booking.status === "pending" && (
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              className="btn sm"
                              style={{ background: "#16a34a", padding: "4px 10px" }}
                              type="button"
                              onClick={() => run(() => acceptBooking(booking.id), `Accepted ${booking.passenger.name}`)}
                            >
                              ✓ Accept
                            </button>
                            <button
                              className="btn sm danger"
                              style={{ padding: "4px 10px" }}
                              type="button"
                              onClick={() => run(() => rejectBooking(booking.id), `Rejected ${booking.passenger.name}`)}
                            >
                              ✕ Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </RideCard>

              {/* Driver Live Route Tracking */}
              {isTracking && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: 6, color: "#1e3a8a" }}>
                    🚗 Driver Live GPS Navigation &amp; Route Telemetry:
                  </div>
                  <RideMap
                    pickup={ride.pickup}
                    drop={ride.drop}
                    liveTracking={true}
                    driverName={ride.driver.name}
                    height="320px"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Section: Rides I Joined (Passenger View) ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "36px 0 12px" }}>
        <h2 style={{ fontSize: "1.15rem", fontWeight: 700 }}>🎫 Rides I Joined (Passenger)</h2>
        <span className="muted" style={{ fontSize: "0.85rem" }}>{joinedVisible.length} booking(s)</span>
      </div>

      <div className="stack">
        {joinedVisible.length === 0 && (
          <div className="card" style={{ padding: 24, textAlign: "center", color: "var(--muted)" }}>
            No joined rides in this tab.
          </div>
        )}

        {joinedVisible.map((booking) => {
          const isTracking = activeTrackingRide?.id === booking.ride.id;
          return (
            <div key={booking.id} className="card" style={{ padding: 20 }}>
              <RideCard ride={booking.ride}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, flexWrap: "wrap", gap: 8 }}>
                  <div style={{ fontSize: "0.88rem" }}>
                    Your booking request:{" "}
                    <span
                      className={
                        "badge-status " +
                        (booking.status === "accepted" ? "accepted" : booking.status === "rejected" ? "rejected" : "pending")
                      }
                    >
                      {booking.status.toUpperCase()}
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className="btn secondary sm"
                      type="button"
                      onClick={() => setActiveTrackingRide(isTracking ? null : booking.ride)}
                    >
                      {isTracking ? "✕ Hide Map" : "🗺️ Track Live Route"}
                    </button>

                    {(booking.status === "pending" || booking.status === "accepted") &&
                      booking.ride.status !== "completed" &&
                      booking.ride.status !== "cancelled" && (
                        <button
                          className="btn sm danger"
                          type="button"
                          onClick={() => run(() => cancelBooking(booking.id), "Request cancelled")}
                        >
                          Cancel Booking
                        </button>
                      )}
                  </div>
                </div>

                {/* Rating Form after trip is completed */}
                {booking.can_rate && (
                  <form
                    style={{
                      marginTop: 14,
                      padding: 14,
                      background: "#f8fafc",
                      borderRadius: 10,
                      border: "1px solid var(--line)",
                    }}
                    onSubmit={(e) => {
                      e.preventDefault();
                      run(
                        () =>
                          createRating({
                            booking_id: booking.id,
                            stars: Number(ratingStars),
                            comment: ratingComment,
                          }),
                        "Rating submitted! Thank you."
                      );
                    }}
                  >
                    <p style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: 8 }}>
                      ⭐ Rate Your Driver ({booking.ride.driver.name})
                    </p>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <label className="field" style={{ minWidth: 100 }}>
                        <span style={{ fontSize: "0.8rem" }}>Stars (1–5)</span>
                        <input
                          type="number"
                          min="1"
                          max="5"
                          value={ratingStars}
                          onChange={(e) => setRatingStars(e.target.value)}
                        />
                      </label>
                      <label className="field" style={{ flex: 1, minWidth: 200 }}>
                        <span style={{ fontSize: "0.8rem" }}>Feedback</span>
                        <input
                          placeholder="How was the ride? Friendly, safe driving..."
                          value={ratingComment}
                          onChange={(e) => setRatingComment(e.target.value)}
                        />
                      </label>
                    </div>
                    <button className="btn sm" type="submit" style={{ marginTop: 8 }}>
                      Submit Rating
                    </button>
                  </form>
                )}

                {booking.my_rating && (
                  <p className="muted" style={{ marginTop: 8, fontSize: "0.85rem" }}>
                    ⭐ You rated this driver {booking.my_rating} stars.
                  </p>
                )}
              </RideCard>

              {/* Passenger Live Route Tracking */}
              {isTracking && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: 6, color: "#1e3a8a" }}>
                    🗺️ Passenger Live Tracking: Driver {booking.ride.driver.name}'s Route to Campus
                  </div>
                  <RideMap
                    pickup={booking.ride.pickup}
                    drop={booking.ride.drop}
                    liveTracking={true}
                    driverName={booking.ride.driver.name}
                    height="320px"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Edit Ride Modal (Driver) ── */}
      {editRideModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={() => setEditRideModal(null)}
        >
          <div
            className="card"
            style={{ maxWidth: 440, width: "100%", padding: 24, background: "white" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: 4 }}>✏️ Edit Ride Details</h3>
            <p className="muted" style={{ fontSize: "0.85rem", marginBottom: 16 }}>
              {editRideModal.pickup.name} → {editRideModal.drop.name} ({editRideModal.ride_date})
            </p>

            <form onSubmit={handleSaveEdit} className="stack">
              <label className="field">
                <span>Total Seats in Vehicle</span>
                <input
                  type="number"
                  min="1"
                  max="6"
                  value={editForm.seats_total}
                  onChange={(e) => setEditForm({ ...editForm, seats_total: e.target.value })}
                  required
                />
              </label>

              <label className="field">
                <span>Fuel Cost / Seat (₹)</span>
                <input
                  type="number"
                  min="0"
                  max="5000"
                  value={editForm.cost_per_seat}
                  onChange={(e) => setEditForm({ ...editForm, cost_per_seat: e.target.value })}
                  required
                />
              </label>

              <label className="field">
                <span>Departure Time</span>
                <input
                  type="time"
                  value={editForm.ride_time}
                  onChange={(e) => setEditForm({ ...editForm, ride_time: e.target.value })}
                  required
                />
              </label>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
                <button
                  className="btn secondary sm"
                  type="button"
                  onClick={() => setEditRideModal(null)}
                >
                  Cancel
                </button>
                <button className="btn sm" type="submit">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
