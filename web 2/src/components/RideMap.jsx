import { APIProvider, Map, Marker } from "@vis.gl/react-google-maps";

const mapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export default function RideMap({ pickup, drop }) {
  if (!mapsKey || !pickup || !drop) {
    return null;
  }
  const center = {
    lat: (pickup.latitude + drop.latitude) / 2,
    lng: (pickup.longitude + drop.longitude) / 2,
  };
  return (
    <div className="map-frame">
      <APIProvider apiKey={mapsKey}>
        <Map defaultCenter={center} defaultZoom={12} gestureHandling="greedy">
          <Marker position={{ lat: pickup.latitude, lng: pickup.longitude }} />
          <Marker position={{ lat: drop.latitude, lng: drop.longitude }} />
        </Map>
      </APIProvider>
    </div>
  );
}
