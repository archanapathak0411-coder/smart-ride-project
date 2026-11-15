import { rupee, stars } from "../utils";

export default function RideCard({ ride, score, reasons, children }) {
  const statusBadge = {
    open: "badge-status accepted",
    full: "badge-status pending",
    cancelled: "badge-status rejected",
    completed: "badge-status completed",
  }[ride.status] || "badge-status pending";

  return (
    <article className="ride-card">
      <div className="ride-main">
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "1.1rem", fontWeight: 700, marginBottom: 8, flexWrap: "wrap" }}>
          <span>📍 {ride.pickup.name}</span>
          <span style={{ color: "var(--muted)" }}>→</span>
          <span>🏁 {ride.drop.name}</span>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 16px", fontSize: "0.85rem", color: "#374151", marginBottom: 10 }}>
          <span>📅 <b>{ride.ride_date}</b> at <b>{ride.ride_time}</b></span>
          <span>💺 <b>{ride.seats_available}/{ride.seats_total}</b> seats left</span>
          <span>💰 <b>{rupee(ride.cost_per_seat)}</b>/seat</span>
          <span>⭐ <b>{ride.driver.name}</b> {ride.driver.branch ? `(${ride.driver.branch})` : ""} · {stars(ride.driver.average_rating)}</span>
          {ride.driver.phone && (
            <span>📞 <a href={`tel:${ride.driver.phone}`} style={{ color: "var(--blue)" }}>{ride.driver.phone}</a></span>
          )}
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
          {ride.status && (
            <span className={statusBadge}>{ride.status.toUpperCase()}</span>
          )}
          {ride.women_only && (
            <span className="badge-status pending" style={{ background: "#f3e8ff", color: "#7e22ce" }}>
              👩 Women-only
            </span>
          )}
        </div>

        {reasons && reasons.length > 0 && (
          <ul className="reasons" style={{ fontSize: "0.82rem", color: "#4b5563" }}>
            {reasons.map((r) => <li key={r}>{r}</li>)}
          </ul>
        )}

        {children}
      </div>

      {score != null && (
        <div className="score" aria-label={"Match score " + score}>
          <strong>{score}</strong>
          <span>MATCH</span>
        </div>
      )}
    </article>
  );
}
