import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV_LINKS = [
  { to: "/dashboard", icon: "🏠", label: "Dashboard" },
  { to: "/find",      icon: "🔍", label: "Find Ride" },
  { to: "/offer",     icon: "🚗", label: "Offer Ride" },
  { to: "/rides",     icon: "📋", label: "My Rides" },
  { to: "/messages",  icon: "💬", label: "Messages", badge: null },
  { to: "/profile",   icon: "👤", label: "Profile" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  /* logged-in → sidebar shell */
  if (user) {
    return (
      <div className="app-shell">
        {/* ── Sidebar ── */}
        <aside className="sidebar">
          <Link className="sidebar-brand" to="/dashboard">
            <span className="sidebar-icon">🚗</span>
            <span>
              JC SmartRide
              <span className="sidebar-tagline">Share Ride · Save Fuel</span>
            </span>
          </Link>

          <nav className="sidebar-nav">
            {NAV_LINKS.map(({ to, icon, label, badge }) => {
              // hide admin-only links for non-admins
              if (to === "/dashboard" && user.role === "admin") return null;
              if (to === "/messages" || to === "/profile") return null; // placeholder pages
              return (
                <NavLink key={to} to={to} className={({ isActive }) => "sidebar-link" + (isActive ? " active" : "")}>
                  <span className="sidebar-icon-s">{icon}</span>
                  {label}
                  {badge != null && <span className="badge">{badge}</span>}
                </NavLink>
              );
            })}
            {user.role === "admin" && (
              <NavLink to="/admin" className={({ isActive }) => "sidebar-link" + (isActive ? " active" : "")}>
                <span className="sidebar-icon-s">🛡️</span>
                Admin
              </NavLink>
            )}
          </nav>

          <div className="sidebar-footer">
            <button className="sidebar-logout" type="button" onClick={logout}>
              <span>🚪</span> Logout
            </button>
          </div>
        </aside>

        {/* ── Main area ── */}
        <div className="app-main">
          {/* top bar */}
          <header className="app-topbar">
            {user.verification_status && user.role === "student" && user.verification_status !== "verified" && (
              <p className="banner" style={{ marginRight: "auto", borderRadius: 8, padding: "6px 14px" }}>
                Account pending verification — browsing only.
              </p>
            )}
            <button className="app-topbar-icon" title="Notifications">🔔</button>
            <button className="app-topbar-icon" title={user.name || user.email}>👤</button>
          </header>

          <div className="app-content">
            <Outlet />
          </div>
        </div>
      </div>
    );
  }

  /* logged-out → public top-bar layout */
  return (
    <div className="page">
      <header className="topbar">
        <Link className="brand" to="/">
          <span className="brand-icon">🚗</span>
          JC SmartRide
        </Link>
        <nav className="nav">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/find">Ride</NavLink>
          <NavLink to="/about">About</NavLink>
          <NavLink to="/contact">Contact</NavLink>
        </nav>
        <div className="nav-actions">
          <Link className="btn ghost" to="/login">Login</Link>
          <Link className="btn" to="/register">Sign Up</Link>
        </div>
      </header>

      <Outlet />
    </div>
  );
}
