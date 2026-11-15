import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { checkVerificationStatus, uploadStudentId } from "../api";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState("login"); // "login" | "verify_check"
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Verification status checker state
  const [checkId, setCheckId] = useState("");
  const [statusResult, setStatusResult] = useState(null);
  const [checkError, setCheckError] = useState("");
  const [checkLoading, setCheckLoading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState("");

  async function submit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(form);
      const savedSearch = sessionStorage.getItem("jc_search");
      if (user.role === "admin") {
        navigate("/admin");
      } else if (savedSearch) {
        navigate("/match", { state: { search: JSON.parse(savedSearch) } });
      } else {
        navigate("/find");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckStatus(event) {
    event.preventDefault();
    setCheckError("");
    setStatusResult(null);
    setUploadSuccess("");
    setCheckLoading(true);
    try {
      const data = await checkVerificationStatus(checkId);
      setStatusResult(data.student);
    } catch (err) {
      setCheckError(err.message);
    } finally {
      setCheckLoading(false);
    }
  }

  function handlePhotoUpload(file) {
    if (!file || !statusResult) return;
    if (file.size > 2 * 1024 * 1024) {
      setCheckError("Image must be smaller than 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        await uploadStudentId(statusResult.email, e.target.result);
        setUploadSuccess("✅ Student ID Photo uploaded! Your verification is now pending admin review.");
        // refresh status
        const refreshed = await checkVerificationStatus(statusResult.email);
        setStatusResult(refreshed.student);
      } catch (err) {
        setCheckError(err.message);
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <div style={{ minHeight: "calc(100vh - 60px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 16px", background: "var(--paper)" }}>
      <div className="form-card" style={{ width: "100%", maxWidth: 480 }}>
        {/* Brand header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div className="brand-icon" style={{ width: 42, height: 42, fontSize: 20, background: "var(--blue)" }}>🚗</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--blue-dark)" }}>JC SmartRide</div>
            <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>Share Ride · Save Fuel · Build Community</div>
          </div>
        </div>

        {/* Tab switch between Login and Verification Status */}
        <div style={{ display: "flex", background: "#e2e8f0", borderRadius: 8, padding: 3, marginBottom: 24 }}>
          <button
            type="button"
            onClick={() => { setMode("login"); setError(""); }}
            style={{
              flex: 1,
              padding: "8px 12px",
              border: "none",
              borderRadius: 6,
              background: mode === "login" ? "white" : "transparent",
              color: mode === "login" ? "var(--blue-dark)" : "var(--muted)",
              fontWeight: 700,
              fontSize: "0.88rem",
              cursor: "pointer",
              boxShadow: mode === "login" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            }}
          >
            🔑 Student / Admin Login
          </button>
          <button
            type="button"
            onClick={() => { setMode("verify_check"); setCheckError(""); }}
            style={{
              flex: 1,
              padding: "8px 12px",
              border: "none",
              borderRadius: 6,
              background: mode === "verify_check" ? "white" : "transparent",
              color: mode === "verify_check" ? "var(--blue-dark)" : "var(--muted)",
              fontWeight: 700,
              fontSize: "0.88rem",
              cursor: "pointer",
              boxShadow: mode === "verify_check" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            }}
          >
            🎓 Check ID Status
          </button>
        </div>

        {location.state?.message && (
          <div className="banner" style={{ marginBottom: 16 }}>
            {location.state.message}
          </div>
        )}

        {/* ── Mode 1: Login Form ── */}
        {mode === "login" ? (
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: 4 }}>Welcome Back!</h1>
            <p className="form-sub" style={{ marginBottom: 20 }}>Login with your campus credentials to continue</p>

            <form onSubmit={submit} className="stack">
              <label className="field">
                <span>Email or College Email</span>
                <input
                  type="email"
                  placeholder="e.g. passenger@jcsmart.local"
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

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: -6 }}>
                <button
                  type="button"
                  onClick={() => setMode("verify_check")}
                  style={{ background: "none", border: "none", color: "var(--blue)", fontSize: "0.82rem", cursor: "pointer", padding: 0 }}
                >
                  Verify Student ID?
                </button>
                <span className="muted" style={{ fontSize: "0.82rem", cursor: "pointer" }}>Forgot Password?</span>
              </div>

              {error && <div className="banner" style={{ background: "#fee2e2", color: "#dc2626" }}>⚠️ {error}</div>}

              <button className="btn" type="submit" disabled={loading} style={{ width: "100%", justifyContent: "center", padding: "12px" }}>
                {loading ? "Logging in…" : "🚀 Login"}
              </button>

              <p style={{ textAlign: "center", fontSize: "0.88rem", color: "var(--muted)", marginTop: 12 }}>
                New student?{" "}
                <Link to="/register" style={{ color: "var(--blue)", fontWeight: 600 }}>Create an account</Link>
              </p>
            </form>
          </div>
        ) : (
          /* ── Mode 2: Student Verification Check on Login Page ── */
          <div>
            <h1 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: 4 }}>🎓 Student ID Verification</h1>
            <p className="form-sub" style={{ marginBottom: 18 }}>
              Check your verification status or upload your Student ID Card photo for admin approval.
            </p>

            <form onSubmit={handleCheckStatus} className="stack" style={{ marginBottom: 20 }}>
              <label className="field">
                <span>Student ID or College Email</span>
                <input
                  type="text"
                  placeholder="e.g. YM2021001 or pending@jcsmart.local"
                  value={checkId}
                  onChange={(e) => setCheckId(e.target.value)}
                  required
                />
              </label>

              {checkError && <div className="banner" style={{ background: "#fee2e2", color: "#dc2626" }}>⚠️ {checkError}</div>}
              {uploadSuccess && <div className="banner" style={{ background: "#dcfce7", color: "#16a34a" }}>{uploadSuccess}</div>}

              <button className="btn" type="submit" disabled={checkLoading} style={{ width: "100%", justifyContent: "center" }}>
                {checkLoading ? "Checking Status…" : "🔍 Check Verification Status"}
              </button>
            </form>

            {statusResult && (
              <div
                style={{
                  background: "#f8fafc",
                  border: "1.5px solid var(--line)",
                  borderRadius: 12,
                  padding: "16px",
                  marginTop: 12,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: "1.05rem" }}>{statusResult.name}</div>
                    <div className="muted" style={{ fontSize: "0.82rem" }}>
                      ID: <b>{statusResult.student_id}</b> · {statusResult.branch}
                    </div>
                  </div>
                  <span
                    className={
                      "badge-status " +
                      (statusResult.verification_status === "verified"
                        ? "accepted"
                        : statusResult.verification_status === "rejected"
                        ? "rejected"
                        : "pending")
                    }
                    style={{ fontSize: "0.8rem", padding: "4px 10px" }}
                  >
                    {statusResult.verification_status.toUpperCase()}
                  </span>
                </div>

                {statusResult.verification_status === "verified" ? (
                  <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", padding: "12px", borderRadius: 8, color: "#065f46", fontSize: "0.85rem" }}>
                    🎉 <b>Account Verified!</b> You have full access to offer and book rides across Faridabad campus routes.
                    <div style={{ marginTop: 8 }}>
                      <button
                        type="button"
                        className="btn sm"
                        style={{ background: "#059669" }}
                        onClick={() => {
                          setMode("login");
                          setForm((f) => ({ ...f, email: statusResult.email }));
                        }}
                      >
                        Proceed to Login →
                      </button>
                    </div>
                  </div>
                ) : statusResult.verification_status === "pending" ? (
                  <div style={{ background: "#fffbeb", border: "1px solid #fde68a", padding: "12px", borderRadius: 8, color: "#92400e", fontSize: "0.85rem" }}>
                    ⏳ <b>Awaiting Admin Approval:</b> Your student ID has been submitted. The campus admin reviews registrations regularly.
                    <div style={{ marginTop: 10 }}>
                      <label className="btn sm outline" style={{ cursor: "pointer", display: "inline-block", color: "#b45309", borderColor: "#f59e0b" }}>
                        📷 {statusResult.has_id_card ? "Replace ID Card Photo" : "Upload Student ID Photo"}
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={(e) => handlePhotoUpload(e.target.files[0])}
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <div style={{ background: "#fef2f2", border: "1px solid #fecaca", padding: "12px", borderRadius: 8, color: "#991b1b", fontSize: "0.85rem" }}>
                    ❌ <b>Verification Rejected:</b> Please upload a clear photo of your official JC Bose University student ID to request re-verification.
                    <div style={{ marginTop: 10 }}>
                      <label className="btn sm danger" style={{ cursor: "pointer", display: "inline-block" }}>
                        📷 Upload Clear Student ID Photo
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={(e) => handlePhotoUpload(e.target.files[0])}
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Quick Demo Credentials Footer */}
        {/* <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--line)", fontSize: "0.78rem", color: "var(--muted)" }}>
          <div style={{ fontWeight: 700, marginBottom: 4, color: "#475569" }}>Demo Accounts:</div>
          <div>👤 Driver: <code>driver@jcsmart.local</code> / <code>Student@123</code></div>
          <div>👤 Passenger: <code>passenger@jcsmart.local</code> / <code>Student@123</code></div>
          <div>🛡️ Admin: <code>admin@jcsmart.local</code> / <code>Admin@12345</code></div>
          <div>⏳ Pending: <code>pending@jcsmart.local</code> / <code>Student@123</code></div>
        </div>*/}
      </div>
    </div>
  );
}
