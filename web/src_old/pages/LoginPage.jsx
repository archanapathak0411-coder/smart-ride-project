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
      navigate(user.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "calc(100vh - 60px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px", background: "var(--paper)" }}>
      <div className="form-card" style={{ width: "100%" }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
          <div className="brand-icon" style={{ width: 40, height: 40, fontSize: 20 }}>🚗</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: "1.05rem" }}>JC SmartRide</div>
            <div style={{ fontSize: "0.72rem", color: "var(--muted)" }}>Share Ride · Save Fuel · Build Community</div>
          </div>
        </div>

        <h1>Welcome Back!</h1>
        <p className="form-sub">Login to continue</p>

        {location.state?.message && (
          <p className="banner" style={{ marginBottom: 16 }}>{location.state.message}</p>
        )}

        <form onSubmit={submit} className="stack">
          <label className="field">
            <span>Email or Phone Number</span>
            <input
              type="email"
              placeholder="you@jcsmart.local"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </label>

          <div style={{ textAlign: "right", marginTop: -8 }}>
            <span className="muted" style={{ fontSize: "0.82rem", cursor: "pointer" }}>Forgot Password?</span>
          </div>

          {error && <p className="error">{error}</p>}

          <button className="btn" type="submit" disabled={loading} style={{ width: "100%", justifyContent: "center", padding: "12px" }}>
            {loading ? "Logging in…" : "Login"}
          </button>

          <p style={{ textAlign: "center", fontSize: "0.88rem", color: "var(--muted)" }}>
            Don't have an account?{" "}
            <Link to="/register" style={{ color: "var(--blue)", fontWeight: 600 }}>Sign Up</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
