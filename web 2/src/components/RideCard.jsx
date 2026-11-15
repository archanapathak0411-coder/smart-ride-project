import { rupee, stars } from "../utils";

export default function RideCard({ ride, score, reasons, children }) {
  const statusClass = {
    open: "tag-green", full: "tag-amber",
    cancelled: "tag-red", completed: "tag-blue",
  }[ride.status] || "tag-gray";

  return (
    <article className="ride-card">
      <div className="ride-main">
        <div className="ride-route">
          <span>📍 {ride.pickup.name}</span>
          <span className="arrow">→</span>
          <span>🏁 {ride.drop.name}</span>
        </div>

        <div className="ride-meta">
          <span>📅 {ride.ride_date}</span>
          <span>🕐 {ride.ride_time}</span>
          <span>💺 {ride.seats_available}/{ride.seats_total} seats</span>
          <span>💰 {rupee(ride.cost_per_seat)}/seat</span>
          <span>⭐ {ride.driver.name} · {stars(ride.driver.average_rating)}</span>
        </div>

        <div className="ride-tags">
          {ride.status && (
            <span className={`tag ${statusClass}`}>{ride.status}</span>
          )}
          {ride.women_only && (
            <span className="tag tag-purple">👩 Women-only</span>
          )}
        </div>

        {reasons && reasons.length > 0 && (
          <ul className="reasons">
            {reasons.map((r) => <li key={r}>{r}</li>)}
          </ul>
        )}
        {children}
      </div>

      {score != null && (
        <div className="score-badge" aria-label={"Match score " + score}>
          <strong>{score}</strong>
          <span>match</span>
        </div>
      )}
    </article>
  );
}
