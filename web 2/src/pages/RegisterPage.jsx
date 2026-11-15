import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const empty = { name: "", email: "", phone: "", student_id: "", password: "" };

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(key, value) {
    setForm((c) => ({ ...c, [key]: value }));
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
    <div className="content-narrow">
      <div className="form-card">
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>🎓</div>
          <h1>Create Account</h1>
          <p className="muted" style={{ marginTop: 4 }}>
            Use your J.C. Bose University student ID. An admin will verify it.
          </p>
        </div>

        <form className="stack" onSubmit={submit}>
          <label className="field">
            <span>Full Name</span>
            <input
              placeholder="Your name"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              required
            />
          </label>
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              placeholder="you@jcbose.ac.in"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              required
            />
          </label>
          <div className="form-grid">
            <label className="field">
              <span>Phone</span>
              <input
                placeholder="10-digit number"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                required
              />
            </label>
            <label className="field">
              <span>Student ID</span>
              <input
                placeholder="e.g. 2021-CS-001"
                value={form.student_id}
                onChange={(e) => update("student_id", e.target.value)}
                required
              />
            </label>
          </div>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              minLength={8}
              required
            />
          </label>

          {error && <div className="alert alert-error">⚠️ {error}</div>}

          <button className="btn btn-primary" type="submit" disabled={loading}
            style={{ justifyContent: "center", marginTop: 4 }}>
            {loading ? "Creating account…" : "🚀 Create Account"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: "0.9rem", color: "var(--muted)" }}>
          Already registered?{" "}
          <Link to="/login" style={{ fontWeight: 600 }}>Login</Link>
        </p>
      </div>
    </div>
  );
}
