import { useEffect, useState } from "react";
import {
  adminBookings, adminCancelRide, adminRides,
  adminStudents, rejectStudent, verifyStudent,
} from "../api";

const STATUS_CLASS = {
  pending:   "pill-pending",
  verified:  "pill-verified",
  rejected:  "pill-rejected",
  open:      "pill-open",
  full:      "pill-full",
  cancelled: "pill-cancelled",
  completed: "pill-completed",
  accepted:  "pill-accepted",
};

export default function AdminPage() {
  const [students, setStudents] = useState([]);
  const [rides,    setRides]    = useState([]);
  const [bookings, setBookings] = useState([]);
  const [error,    setError]    = useState("");
  const [tab,      setTab]      = useState("students");

  async function load() {
    setError("");
    try {
      const [s, r, b] = await Promise.all([
        adminStudents(), adminRides(), adminBookings(),
      ]);
      setStudents(s.students);
      setRides(r.rides);
      setBookings(b.bookings);
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

  return (
    <div className="content-wide">
      <div className="page-header">
        <h1>🛡️ Admin Dashboard</h1>
        <p>Verify student IDs and monitor all rides and bookings.</p>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 16 }}>⚠️ {error}</div>
      )}

      {/* Summary cards */}
      <div className="grid-3" style={{ marginBottom: 28 }}>
        {[
          { icon: "🎓", label: "Students", value: students.length, color: "var(--primary)" },
          { icon: "🚗", label: "Rides",    value: rides.length,    color: "var(--blue)"    },
          { icon: "🎫", label: "Bookings", value: bookings.length, color: "var(--purple)"  },
        ].map((s) => (
          <div key={s.label} className="card" style={{ textAlign: "center", padding: "20px" }}>
            <div style={{ fontSize: "2rem", marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: "1.8rem", fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: "0.85rem", color: "var(--muted)", fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs">
        {["students", "rides", "bookings"].map((t) => (
          <button
            key={t}
            className={"tab" + (tab === t ? " active" : "")}
            type="button"
            onClick={() => setTab(t)}
          >
            {{ students: "🎓 Students", rides: "🚗 Rides", bookings: "🎫 Bookings" }[t]}
          </button>
        ))}
      </div>

      {/* Students table */}
      {tab === "students" && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Student ID</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 600 }}>{s.name}</td>
                  <td style={{ color: "var(--muted)" }}>{s.email}</td>
                  <td><code style={{ background: "var(--paper)", padding: "2px 6px", borderRadius: 4 }}>{s.student_id}</code></td>
                  <td>
                    <span className={"pill " + (STATUS_CLASS[s.verification_status] || "pill-pending")}>
                      {s.verification_status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ marginRight: 6 }}
                      type="button"
                      onClick={() => run(() => verifyStudent(s.id))}
                    >
                      ✅ Verify
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      type="button"
                      onClick={() => run(() => rejectStudent(s.id))}
                    >
                      ❌ Reject
                    </button>
                  </td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr><td colSpan={5} style={{ color: "var(--muted)", textAlign: "center" }}>No students found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Rides table */}
      {tab === "rides" && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Driver</th>
                <th>Route</th>
                <th>Date &amp; Time</th>
                <th>Seats</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rides.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600 }}>{r.driver.name}</td>
                  <td>{r.pickup.name} → {r.drop.name}</td>
                  <td style={{ color: "var(--muted)" }}>{r.ride_date} {r.ride_time}</td>
                  <td>{r.seats_available}/{r.seats_total}</td>
                  <td><span className={"pill " + (STATUS_CLASS[r.status] || "pill-pending")}>{r.status}</span></td>
                  <td>
                    {r.status !== "cancelled" && r.status !== "completed" && (
                      <button
                        className="btn btn-danger btn-sm"
                        type="button"
                        onClick={() => run(() => adminCancelRide(r.id))}
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {rides.length === 0 && (
                <tr><td colSpan={6} style={{ color: "var(--muted)", textAlign: "center" }}>No rides found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Bookings table */}
      {tab === "bookings" && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Passenger</th>
                <th>Driver</th>
                <th>Route</th>
                <th>Date &amp; Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 600 }}>{b.passenger_name}</td>
                  <td>{b.driver_name}</td>
                  <td>{b.pickup} → {b.drop}</td>
                  <td style={{ color: "var(--muted)" }}>{b.ride_date} {b.ride_time}</td>
                  <td><span className={"pill " + (STATUS_CLASS[b.status] || "pill-pending")}>{b.status}</span></td>
                </tr>
              ))}
              {bookings.length === 0 && (
                <tr><td colSpan={5} style={{ color: "var(--muted)", textAlign: "center" }}>No bookings found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
