import { useEffect, useState } from "react";
import {
  adminBookings,
  adminCancelRide,
  adminRides,
  adminStudents,
  adminUploadPhoto,
  deleteStudent,
  rejectStudent,
  verifyStudent,
} from "../api";

const STATUS_CLASS = {
  pending: "badge-status pending",
  verified: "badge-status accepted",
  rejected: "badge-status rejected",
  open: "badge-status accepted",
  full: "badge-status pending",
  cancelled: "badge-status cancelled",
  completed: "badge-status completed",
  accepted: "badge-status accepted",
};

export default function AdminPage() {
  const [students, setStudents] = useState([]);
  const [rides, setRides] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tab, setTab] = useState("students");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal for previewing Student ID Card Photo
  const [photoModal, setPhotoModal] = useState(null); // { user, photo }
  // Student ID deletion confirmation
  const [deleteConfirm, setDeleteConfirm] = useState(null); // student object

  async function load() {
    setError("");
    try {
      const [s, r, b] = await Promise.all([
        adminStudents(),
        adminRides(),
        adminBookings(),
      ]);
      setStudents(s.students);
      setRides(r.rides);
      setBookings(b.bookings);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function run(action, successMsg = "") {
    setError("");
    setSuccess("");
    try {
      await action();
      if (successMsg) {
        setSuccess(successMsg);
        setTimeout(() => setSuccess(""), 4000);
      }
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  function handlePhotoUpload(studentId, file) {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("Image size must be under 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result;
      run(() => adminUploadPhoto(studentId, base64), "✅ Student ID Photo updated successfully!");
    };
    reader.readAsDataURL(file);
  }

  // Filter students by query and status
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      (s.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.student_id || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.branch || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || s.verification_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: 4 }}>🛡️ Admin Dashboard</h1>
          <p className="muted" style={{ fontSize: "0.9rem" }}>
            Student ID Verification, ID Card Photos, User Management, and Campus Rides Monitor.
          </p>
        </div>
      </div>

      {error && <div className="banner" style={{ background: "#fee2e2", color: "#dc2626", marginBottom: 16 }}>⚠️ {error}</div>}
      {success && <div className="banner" style={{ background: "#dcfce7", color: "#16a34a", marginBottom: 16 }}>{success}</div>}

      {/* Summary KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        <div className="card" style={{ textAlign: "center", padding: "16px" }}>
          <div style={{ fontSize: "1.6rem" }}>🎓</div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--blue)" }}>{students.length}</div>
          <div className="muted" style={{ fontSize: "0.82rem" }}>Total Students</div>
        </div>
        <div className="card" style={{ textAlign: "center", padding: "16px" }}>
          <div style={{ fontSize: "1.6rem" }}>⏳</div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#d97706" }}>
            {students.filter((s) => s.verification_status === "pending").length}
          </div>
          <div className="muted" style={{ fontSize: "0.82rem" }}>Pending Verification</div>
        </div>
        <div className="card" style={{ textAlign: "center", padding: "16px" }}>
          <div style={{ fontSize: "1.6rem" }}>🚗</div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#16a34a" }}>{rides.length}</div>
          <div className="muted" style={{ fontSize: "0.82rem" }}>Campus Rides</div>
        </div>
        <div className="card" style={{ textAlign: "center", padding: "16px" }}>
          <div style={{ fontSize: "1.6rem" }}>🎫</div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#7c3aed" }}>{bookings.length}</div>
          <div className="muted" style={{ fontSize: "0.82rem" }}>Passenger Bookings</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={"tab" + (tab === "students" ? " active" : "")}
          type="button"
          onClick={() => setTab("students")}
        >
          🎓 Students &amp; ID Verification ({students.length})
        </button>
        <button
          className={"tab" + (tab === "rides" ? " active" : "")}
          type="button"
          onClick={() => setTab("rides")}
        >
          🚗 All Rides ({rides.length})
        </button>
        <button
          className={"tab" + (tab === "bookings" ? " active" : "")}
          type="button"
          onClick={() => setTab("bookings")}
        >
          🎫 All Bookings ({bookings.length})
        </button>
      </div>

      {/* ── Students Tab ── */}
      {tab === "students" && (
        <div className="card">
          {/* Filter Bar */}
          <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
            <input
              type="text"
              placeholder="Search by name, email, student ID, branch…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                border: "1.5px solid var(--line)",
                minWidth: 280,
                fontSize: "0.9rem",
              }}
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                border: "1.5px solid var(--line)",
                fontSize: "0.9rem",
                background: "white",
              }}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending Only</option>
              <option value="verified">Verified Only</option>
              <option value="rejected">Rejected Only</option>
            </select>
            <div className="muted" style={{ fontSize: "0.85rem", marginLeft: "auto" }}>
              Showing {filteredStudents.length} of {students.length} students
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Student ID</th>
                  <th>Branch</th>
                  <th>Status</th>
                  <th>Student ID Photo</th>
                  <th>Actions</th>
                  <th>Delete</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{s.name}</div>
                      <div className="muted" style={{ fontSize: "0.78rem" }}>📞 {s.phone}</div>
                    </td>
                    <td style={{ color: "var(--muted)", fontSize: "0.88rem" }}>{s.email}</td>
                    <td>
                      <code style={{ background: "var(--paper)", padding: "3px 8px", borderRadius: 4, fontWeight: 600 }}>
                        {s.student_id}
                      </code>
                    </td>
                    <td>
                      <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "#334155" }}>
                        {s.branch || "Computer Engineering"}
                      </span>
                    </td>
                    <td>
                      <span className={STATUS_CLASS[s.verification_status] || "badge-status pending"}>
                        {s.verification_status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {s.id_card_photo ? (
                          <button
                            type="button"
                            className="btn sm outline"
                            style={{ padding: "4px 8px", fontSize: "0.78rem", color: "var(--blue)", border: "1px solid var(--blue)" }}
                            onClick={() => setPhotoModal({ user: s, photo: s.id_card_photo })}
                            title="Click to view full Student ID card"
                          >
                            📷 View Photo
                          </button>
                        ) : (
                          <span className="muted" style={{ fontSize: "0.75rem" }}>No photo</span>
                        )}

                        {/* Upload / replace button */}
                        <label
                          className="btn sm ghost"
                          style={{
                            padding: "4px 8px",
                            fontSize: "0.75rem",
                            cursor: "pointer",
                            margin: 0,
                          }}
                          title="Upload / Replace student ID photo"
                        >
                          📤 Upload
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: "none" }}
                            onChange={(e) => handlePhotoUpload(s.id, e.target.files[0])}
                          />
                        </label>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        {s.verification_status !== "verified" && (
                          <button
                            className="btn sm"
                            style={{ background: "#16a34a", padding: "4px 10px", fontSize: "0.8rem" }}
                            type="button"
                            onClick={() => run(() => verifyStudent(s.id), `✅ ${s.name} verified successfully!`)}
                          >
                            ✓ Verify
                          </button>
                        )}
                        {s.verification_status !== "rejected" && (
                          <button
                            className="btn sm"
                            style={{ background: "#f59e0b", padding: "4px 10px", fontSize: "0.8rem" }}
                            type="button"
                            onClick={() => run(() => rejectStudent(s.id), `❌ ${s.name} verification rejected`)}
                          >
                            ✕ Reject
                          </button>
                        )}
                      </div>
                    </td>
                    <td>
                      <button
                        className="btn sm danger"
                        style={{ padding: "4px 8px", fontSize: "0.78rem" }}
                        type="button"
                        onClick={() => setDeleteConfirm(s)}
                        title="Delete student record"
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: 30, color: "var(--muted)" }}>
                      No students found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Rides Tab ── */}
      {tab === "rides" && (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Driver</th>
                  <th>Route</th>
                  <th>Date &amp; Time</th>
                  <th>Seats</th>
                  <th>Fare</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rides.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{r.driver.name}</div>
                      <div className="muted" style={{ fontSize: "0.78rem" }}>📞 {r.driver.phone || "—"}</div>
                    </td>
                    <td>{r.pickup.name} → {r.drop.name}</td>
                    <td style={{ color: "var(--muted)" }}>{r.ride_date} at {r.ride_time}</td>
                    <td>{r.seats_available} / {r.seats_total} left</td>
                    <td style={{ fontWeight: 600 }}>₹{r.cost_per_seat}</td>
                    <td><span className={STATUS_CLASS[r.status] || "badge-status pending"}>{r.status}</span></td>
                    <td>
                      {r.status !== "cancelled" && r.status !== "completed" && (
                        <button
                          className="btn sm danger"
                          type="button"
                          onClick={() => run(() => adminCancelRide(r.id), "Ride cancelled by admin")}
                        >
                          Cancel Ride
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {rides.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: 30, color: "var(--muted)" }}>
                      No rides found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Bookings Tab ── */}
      {tab === "bookings" && (
        <div className="card">
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
                    <td style={{ fontWeight: 700 }}>{b.passenger_name}</td>
                    <td>{b.driver_name}</td>
                    <td>{b.pickup} → {b.drop}</td>
                    <td style={{ color: "var(--muted)" }}>{b.ride_date} at {b.ride_time}</td>
                    <td><span className={STATUS_CLASS[b.status] || "badge-status pending"}>{b.status}</span></td>
                  </tr>
                ))}
                {bookings.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: 30, color: "var(--muted)" }}>
                      No bookings found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Photo Modal ── */}
      {photoModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={() => setPhotoModal(null)}
        >
          <div
            className="card"
            style={{ maxWidth: 440, width: "100%", padding: 24, textAlign: "center", background: "white" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: 4 }}>🎓 Student ID Card</h3>
            <p className="muted" style={{ fontSize: "0.85rem", marginBottom: 16 }}>
              {photoModal.user?.name} · {photoModal.user?.student_id} · {photoModal.user?.branch}
            </p>

            <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid var(--line)", marginBottom: 18, background: "#f8fafc" }}>
              <img
                src={photoModal.photo}
                alt="Student ID Card"
                style={{ width: "100%", maxHeight: 280, objectFit: "contain", display: "block" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <button
                className="btn secondary sm"
                type="button"
                onClick={() => setPhotoModal(null)}
              >
                Close
              </button>
              {photoModal.user?.verification_status !== "verified" && (
                <button
                  className="btn sm"
                  style={{ background: "#16a34a" }}
                  type="button"
                  onClick={() => {
                    run(() => verifyStudent(photoModal.user.id), `✅ ${photoModal.user.name} verified!`);
                    setPhotoModal(null);
                  }}
                >
                  ✅ Verify Student
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteConfirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            className="card"
            style={{ maxWidth: 420, width: "100%", padding: 24, textAlign: "center", background: "white" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: "2.5rem", marginBottom: 10 }}>⚠️</div>
            <h3 style={{ marginBottom: 8, color: "#dc2626" }}>Confirm Student Deletion</h3>
            <p style={{ fontSize: "0.9rem", color: "#475569", marginBottom: 18 }}>
              Are you sure you want to delete student <b>{deleteConfirm.name}</b> (<code>{deleteConfirm.student_id}</code>)?
              <br />
              All their offered rides and bookings will also be removed.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button
                className="btn secondary sm"
                type="button"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button
                className="btn sm danger"
                type="button"
                onClick={() => {
                  run(() => deleteStudent(deleteConfirm.id), `🗑️ ${deleteConfirm.name} deleted.`);
                  setDeleteConfirm(null);
                }}
              >
                Yes, Delete Student
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
