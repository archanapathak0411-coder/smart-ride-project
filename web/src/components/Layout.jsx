import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="page">
      {/* ── Navbar ── */}
      <header className="navbar">
        <div className="navbar-inner">
          <Link className="brand" to="/">
            <div className="brand-icon">🚗</div>
            <div className="brand-text">
              <span className="brand-name">
                JC <span>Smart</span>Ride
              </span>
              <span className="brand-sub">JC Bose University</span>
            </div>
          </Link>

          <ul className="nav-links">
            <li><NavLink to="/">Home</NavLink></li>
            <li><NavLink to="/find">Find Ride</NavLink></li>
            <li><NavLink to="/offer">Offer Ride</NavLink></li>
            {user && <li><NavLink to="/rides">My Rides</NavLink></li>}
            {user && user.role === "admin" && (
              <li><NavLink to="/admin">Admin</NavLink></li>
            )}
          </ul>

          <div className="nav-auth">
            {user ? (
              <>
                <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                  👋 {user.name?.split(" ")[0]}
                </span>
                <button
                  className="btn btn-outline btn-sm"
                  type="button"
                  onClick={logout}
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <NavLink className="btn btn-ghost btn-sm" to="/login">
                  Login
                </NavLink>
                <NavLink className="btn btn-primary btn-sm" to="/register">
                  Sign Up
                </NavLink>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Unverified banner ── */}
      {user &&
        user.role === "student" &&
        user.verification_status !== "verified" && (
          <div className="status-banner">
            <span>⏳</span>
            <span>
              Hello {user.name}. Your student ID is{" "}
              <strong>{user.verification_status}</strong>. You can browse rides
              now. Offering and booking open after an admin verifies you.
            </span>
          </div>
        )}

      {/* ── Page content ── */}
      <main className="page-main">
        <Outlet />
      </main>

      {/* ── Footer ── */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <span style={{ fontSize: "1.4rem" }}>🚗</span>
            <span className="footer-brand-name">
              JC <span>Smart</span>Ride
            </span>
          </div>
          <nav className="footer-links">
            <Link to="/">Home</Link>
            <Link to="/find">Find Ride</Link>
            <Link to="/offer">Offer Ride</Link>
            {user && <Link to="/rides">My Rides</Link>}
          </nav>
        </div>
        <div className="footer-copy">
          © {new Date().getFullYear()} JC SmartRide — J.C. Bose University of Science &amp; Technology, YMCA
        </div>
      </footer>
    </div>
  );
}
