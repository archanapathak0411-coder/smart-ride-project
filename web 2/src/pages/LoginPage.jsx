import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(form);
      navigate(user.role === "admin" ? "/admin" : "/find");
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
          <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>🚗</div>
          <h1>Welcome Back</h1>
          <p className="muted" style={{ marginTop: 4 }}>Log in to your JC SmartRide account</p>
        </div>

        {location.state?.message && (
          <div className="alert alert-info" style={{ marginBottom: 16 }}>
            ℹ️ {location.state.message}
          </div>
        )}

        <form className="stack" onSubmit={submit}>
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              placeholder="you@jcbose.ac.in"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </label>

          {error && (
            <div className="alert alert-error">⚠️ {error}</div>
          )}

          <button className="btn btn-primary" type="submit" disabled={loading}
            style={{ justifyContent: "center", marginTop: 4 }}>
            {loading ? "Logging in…" : "🔑 Login"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: "0.9rem", color: "var(--muted)" }}>
          New student?{" "}
          <Link to="/register" style={{ fontWeight: 600 }}>Create an account</Link>
        </p>
      </div>
    </div>
  );
}
