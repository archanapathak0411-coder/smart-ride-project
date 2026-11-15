import SearchForm from "../components/SearchForm";

export default function FindRidePage() {
  return (
    <div style={{ maxWidth: 840, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 className="page-title" style={{ marginBottom: 4 }}>🔍 Pick &amp; Find a Campus Ride</h1>
        <p className="muted" style={{ fontSize: "0.9rem" }}>
          Select your departure point, destination, date and time. Our AI smart matcher ranks carpools by proximity, time match, and driver rating.
        </p>
      </div>

      <div className="card" style={{ padding: 24 }}>
        <SearchForm />
      </div>

      <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        <div className="card" style={{ padding: 16, textAlign: "center" }}>
          <div style={{ fontSize: "1.6rem", marginBottom: 6 }}>📍</div>
          <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>Multiple Faridabad Hubs</div>
          <div className="muted" style={{ fontSize: "0.78rem", marginTop: 4 }}>
            Sector 15, 16, 21, Badarpur Border, Ballabhgarh, NIT &amp; Campus
          </div>
        </div>
        <div className="card" style={{ padding: 16, textAlign: "center" }}>
          <div style={{ fontSize: "1.6rem", marginBottom: 6 }}>🎯</div>
          <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>Smart Match Score</div>
          <div className="muted" style={{ fontSize: "0.78rem", marginTop: 4 }}>
            AI calculates 0–100% route alignment with KNN ranking
          </div>
        </div>
        <div className="card" style={{ padding: 16, textAlign: "center" }}>
          <div style={{ fontSize: "1.6rem", marginBottom: 6 }}>💸</div>
          <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>Save 60%+ on Fuel</div>
          <div className="muted" style={{ fontSize: "0.78rem", marginTop: 4 }}>
            Direct savings compared to daily solo auto or cab commuting
          </div>
        </div>
      </div>
    </div>
  );
}
