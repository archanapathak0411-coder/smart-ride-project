import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const BRANCHES = [
  "Computer Engineering",
  "Information Technology",
  "Electronics & Communication (ECE)",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Master of Computer Applications (MCA)",
  "Master of Business Administration (MBA)",
  "Physics / Chemistry / Mathematics",
  "Other Department",
];

const empty = {
  name: "",
  email: "",
  phone: "",
  student_id: "",
  branch: "Computer Engineering",
  password: "",
  id_card_photo: null,
};

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(key, value) {
    setForm((c) => ({ ...c, [key]: value }));
  }

  function handlePhotoUpload(file) {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("ID Card photo must be smaller than 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      setPhotoPreview(dataUrl);
      update("id_card_photo", dataUrl);
    };
    reader.readAsDataURL(file);
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form);
      navigate("/find");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "calc(100vh - 60px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 16px", background: "var(--paper)" }}>
      <div className="form-card" style={{ width: "100%", maxWidth: 520 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: "2.4rem", marginBottom: 6 }}>🎓</div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800 }}>Student Registration</h1>
          <p className="muted" style={{ fontSize: "0.85rem", marginTop: 4 }}>
            Join JC SmartRide. Register with your J.C. Bose University student details.
          </p>
        </div>

        <form className="stack" onSubmit={submit}>
          <label className="field">
            <span>Full Name</span>
            <input
              placeholder="e.g. Archana Pathak"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              required
            />
          </label>

          <label className="field">
            <span>College / Student Email</span>
            <input
              type="email"
              placeholder="e.g. archana@jcbose.ac.in"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              required
            />
          </label>

          <div className="form-grid">
            <label className="field">
              <span>Mobile Phone</span>
              <input
                placeholder="10-digit number"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                required
              />
            </label>
            <label className="field">
              <span>Student ID / Roll No.</span>
              <input
                placeholder="e.g. YM2022105"
                value={form.student_id}
                onChange={(e) => update("student_id", e.target.value)}
                required
              />
            </label>
          </div>

          <label className="field">
            <span>Academic Department / Branch</span>
            <select
              value={form.branch}
              onChange={(e) => update("branch", e.target.value)}
              required
            >
              {BRANCHES.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </label>

          {/* Student ID Photo Upload */}
          <div className="field">
            <span>Student ID Card Photo (For Admin Verification)</span>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 4 }}>
              <label className="btn secondary sm" style={{ cursor: "pointer", margin: 0 }}>
                📷 {photoPreview ? "Change Photo" : "Upload ID Photo"}
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => handlePhotoUpload(e.target.files[0])}
                />
              </label>
              <span className="muted" style={{ fontSize: "0.8rem" }}>
                {photoPreview ? "Photo attached ✓" : "Upload student ID card"}
              </span>
            </div>
            {photoPreview && (
              <div style={{ marginTop: 8, borderRadius: 8, overflow: "hidden", border: "1px solid var(--line)", maxHeight: 140 }}>
                <img src={photoPreview} alt="ID preview" style={{ width: "100%", height: 140, objectFit: "contain", background: "#f8fafc" }} />
              </div>
            )}
          </div>

          <label className="field">
            <span>Create Password</span>
            <input
              type="password"
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              minLength={8}
              required
            />
          </label>

          {error && <div className="banner" style={{ background: "#fee2e2", color: "#dc2626" }}>⚠️ {error}</div>}

          <button className="btn" type="submit" disabled={loading}
            style={{ justifyContent: "center", marginTop: 6, padding: "12px" }}>
            {loading ? "Registering…" : "🚀 Create Student Account"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: "0.88rem", color: "var(--muted)" }}>
          Already registered?{" "}
          <Link to="/login" style={{ color: "var(--blue)", fontWeight: 600 }}>Login here</Link>
        </p>
      </div>
    </div>
  );
}
