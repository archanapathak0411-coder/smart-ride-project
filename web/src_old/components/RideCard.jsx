import { rupee, stars } from "../utils";

export default function RideCard({ ride, score, reasons, children }) {
  return (
    <article className="card ride-card">
      <div className="ride-main">
        <h3>
          {ride.pickup.name} to {ride.drop.name}
        </h3>
        <p>
          {ride.ride_date} at {ride.ride_time}
          {ride.women_only ? " · Women-only" : ""}
        </p>
        <p>
          {ride.seats_available} of {ride.seats_total} seats · {rupee(ride.cost_per_seat)} per seat
        </p>
        <p className="muted">
          {ride.driver.name} · {stars(ride.driver.average_rating)}
          {ride.status ? " · " + ride.status : ""}
        </p>
        {reasons && reasons.length > 0 && (
          <ul className="reasons">
            {reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        )}
        {children}
      </div>
      {score != null && (
        <div className="score" aria-label={"Match score " + score}>
          <strong>{score}</strong>
          <span>match</span>
        </div>
      )}
    </article>
  );
}
