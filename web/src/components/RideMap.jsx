import { useEffect, useRef, useState } from "react";

/**
 * Interactive Live Map & Route Tracker using Leaflet / OpenStreetMap.
 * Requires NO API key, works seamlessly in browser with SVG fallback.
 */
export default function RideMap({
  pickup,
  drop,
  liveTracking = false,
  interactive = true,
  height = "260px",
  driverName = "Driver",
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const carMarkerRef = useRef(null);
  const animFrameRef = useRef(null);

  const [isSimulating, setIsSimulating] = useState(liveTracking);
  const [progress, setProgress] = useState(0.25); // 0 to 1
  const [speed, setSpeed] = useState(38);
  const [etaMins, setEtaMins] = useState(12);

  // Derive coords — safe defaults when pickup/drop are absent
  const pLat = pickup?.latitude || pickup?.lat || 28.36747;
  const pLng = pickup?.longitude || pickup?.lng || 77.31589;
  const dLat = drop?.latitude || drop?.lat || 28.4024;
  const dLng = drop?.longitude || drop?.lng || 77.3201;

  // Approximate route coordinates with intermediate waypoints
  const waypoints = [
    [pLat, pLng],
    [pLat + (dLat - pLat) * 0.35 + 0.002, pLng + (dLng - pLng) * 0.3 - 0.001],
    [pLat + (dLat - pLat) * 0.7 - 0.001, pLng + (dLng - pLng) * 0.75 + 0.002],
    [dLat, dLng],
  ];

  // Interpolate position along waypoints given t in [0, 1]
  function getPositionAt(t) {
    const clamped = Math.max(0, Math.min(1, t));
    const segments = waypoints.length - 1;
    const scaled = clamped * segments;
    const index = Math.min(Math.floor(scaled), segments - 1);
    const subT = scaled - index;
    const p1 = waypoints[index];
    const p2 = waypoints[index + 1];
    return [
      p1[0] + (p2[0] - p1[0]) * subT,
      p1[1] + (p2[1] - p1[1]) * subT,
    ];
  }

  // Initialize or update Leaflet Map — guard logic is INSIDE the effect, not before it
  useEffect(() => {
    // Guard inside effect (not between hooks) — this is the correct pattern
    if (!pickup || !drop) return;
    if (!mapContainerRef.current) return;
    const L = window.L;

    if (!L) {
      return; // will render clean SVG fallback
    }

    // Destroy existing instance if container was reused
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove();
      } catch (e) {
        // ignore
      }
      mapInstanceRef.current = null;
    }

    try {
      const map = L.map(mapContainerRef.current, {
        zoomControl: interactive,
        attributionControl: false,
        dragging: interactive,
        scrollWheelZoom: false,
      });

      mapInstanceRef.current = map;

      // Clean OpenStreetMap tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
      }).addTo(map);

      // Custom Pickup Icon
      const pickupIcon = L.divIcon({
        className: "custom-map-pin",
        html: `<div style="background:#16a34a;color:white;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-size:14px;border:2px solid white;">📍</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
      });

      // Custom Drop Icon
      const dropIcon = L.divIcon({
        className: "custom-map-pin",
        html: `<div style="background:#dc2626;color:white;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-size:14px;border:2px solid white;">🏁</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
      });

      // Add Markers
      const pickupMarker = L.marker([pLat, pLng], { icon: pickupIcon }).addTo(map);
      pickupMarker.bindPopup(`<b>Pickup:</b> ${pickup.name || "Pickup"}`);

      const dropMarker = L.marker([dLat, dLng], { icon: dropIcon }).addTo(map);
      dropMarker.bindPopup(`<b>Drop:</b> ${drop.name || "Destination"}`);

      // Route Polyline
      const routeLine = L.polyline(waypoints, {
        color: "#2563eb",
        weight: 5,
        opacity: 0.85,
        lineCap: "round",
        lineJoin: "round",
        dashArray: liveTracking ? "8, 8" : undefined,
      }).addTo(map);

      // Car Icon for Live Tracking
      const carIcon = L.divIcon({
        className: "custom-car-pin",
        html: `<div style="background:#1e3a8a;color:white;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(30,58,138,0.5);font-size:18px;border:3px solid #60a5fa;transition:transform 0.2s;">🚗</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const startCarPos = getPositionAt(progress);
      const carMarker = L.marker(startCarPos, { icon: carIcon }).addTo(map);
      carMarker.bindPopup(`<b>${driverName} is on route</b><br>Speed: ${speed} km/h`);
      carMarkerRef.current = carMarker;

      // Fit bounds
      const bounds = L.latLngBounds([[pLat, pLng], [dLat, dLng]]);
      map.fitBounds(bounds, { padding: [40, 40] });
    } catch (err) {
      console.warn("Leaflet map init notice:", err);
    }

    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {}
        mapInstanceRef.current = null;
      }
    };
  }, [pLat, pLng, dLat, dLng]);

  // Live Tracking Animation
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        let next = prev + 0.015;
        if (next > 1.0) next = 0.05; // loop simulation

        const newPos = getPositionAt(next);
        if (carMarkerRef.current) {
          carMarkerRef.current.setLatLng(newPos);
        }

        // update simulated telemetry
        const remaining = Math.max(1, Math.round((1 - next) * 16));
        setEtaMins(remaining);
        const dynamicSpeed = Math.round(32 + Math.sin(next * 10) * 10);
        setSpeed(dynamicSpeed);

        return next;
      });
    }, 800);

    return () => clearInterval(interval);
  }, [isSimulating]);

  // If no pickup/drop yet, show placeholder (inside return — hooks already ran above)
  if (!pickup || !drop) {
    return (
      <div
        style={{
          height,
          background: "#f1f5f9",
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#94a3b8",
          fontSize: "0.9rem",
          border: "1px solid var(--line)",
        }}
      >
        🗺️ Select pickup and drop to preview route
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: "100%", borderRadius: 12, overflow: "hidden", border: "1px solid var(--line)" }}>
      {/* Map Container */}
      <div
        ref={mapContainerRef}
        style={{
          width: "100%",
          height,
          background: "#e2e8f0",
          zIndex: 1,
        }}
      >
        {/* Render fallback SVG while Leaflet is loading or if unavailable */}
        {!window.L && (
          <div
            style={{
              width: "100%",
              height: "100%",
              background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <svg width="100%" height="100%" viewBox="0 0 400 180" style={{ position: "absolute", inset: 0 }}>
              <path
                d="M 50 130 C 140 40, 260 160, 350 50"
                fill="none"
                stroke="#2563eb"
                strokeWidth="5"
                strokeDasharray="6,6"
              />
              <circle cx="50" cy="130" r="10" fill="#16a34a" stroke="#fff" strokeWidth="3" />
              <text x="50" y="160" fontSize="11" fontWeight="bold" fill="#16a34a" textAnchor="middle">
                {pickup.name ? pickup.name.slice(0, 16) : "Pickup"}
              </text>
              <circle cx="350" cy="50" r="10" fill="#dc2626" stroke="#fff" strokeWidth="3" />
              <text x="350" y="32" fontSize="11" fontWeight="bold" fill="#dc2626" textAnchor="middle">
                {drop.name ? drop.name.slice(0, 16) : "Drop"}
              </text>
              <circle cx={50 + progress * 300} cy={130 - progress * 80} r="14" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="3" />
              <text x={50 + progress * 300} y={135 - progress * 80} fontSize="12" textAnchor="middle" fill="white">🚗</text>
            </svg>
          </div>
        )}
      </div>

      {/* Live Route Tracking HUD Overlay */}
      {liveTracking && (
        <div
          style={{
            position: "absolute",
            bottom: 12,
            left: 12,
            right: 12,
            zIndex: 10,
            background: "rgba(15, 23, 42, 0.92)",
            backdropFilter: "blur(8px)",
            color: "white",
            padding: "12px 16px",
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
            fontSize: "0.85rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                display: "inline-block",
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "#22c55e",
                boxShadow: "0 0 10px #22c55e",
                animation: "pulse 1.5s infinite",
              }}
            />
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "#f8fafc" }}>
                Live Tracking Active
              </div>
              <div style={{ color: "#94a3b8", fontSize: "0.78rem" }}>
                {pickup.name || "Start"} → {drop.name || "Destination"}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "0.72rem", color: "#94a3b8", textTransform: "uppercase" }}>Speed</div>
              <div style={{ fontWeight: 700, color: "#60a5fa" }}>{speed} km/h</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "0.72rem", color: "#94a3b8", textTransform: "uppercase" }}>ETA</div>
              <div style={{ fontWeight: 700, color: "#34d399" }}>{etaMins} mins</div>
            </div>
            {/*<button
              type="button"
              onClick={() => setIsSimulating(!isSimulating)}
              style={{
                background: isSimulating ? "#475569" : "#2563eb",
                color: "white",
                border: "none",
                borderRadius: 6,
                padding: "6px 12px",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.8rem",
              }
            
              {isSimulating ? "⏸ Pause" : "▶ Resume"}
            </button>*/}
          </div>
        </div>
      )}
    </div>
  );
}
