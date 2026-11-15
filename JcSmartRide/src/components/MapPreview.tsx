import React, { useEffect, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { GOOGLE_MAPS_API_KEY } from "../config";
import { colors } from "../theme";

type Point = { latitude: number; longitude: number; name: string };

type Props = {
  pickup?: Point;
  drop?: Point;
  tracking?: boolean;
};

export default function MapPreview({ pickup, drop, tracking = false }: Props) {
  const [progress, setProgress] = useState(0.25);

  useEffect(() => {
    if (!tracking) return undefined;
    const timer = setInterval(() => {
      setProgress(current => current + 0.015 >= 1 ? 0.05 : current + 0.015);
    }, 800);
    return () => clearInterval(timer);
  }, [tracking]);

  if (!pickup || !drop) {
    return null;
  }
  const car = {
    latitude: pickup.latitude + (drop.latitude - pickup.latitude) * progress,
    longitude: pickup.longitude + (drop.longitude - pickup.longitude) * progress,
  };
  const eta = Math.max(1, Math.round((1 - progress) * 16));
  const speed = Math.round(32 + Math.sin(progress * 10) * 10);

  if (Platform.OS === "android" && !GOOGLE_MAPS_API_KEY) {
    return (
      <View style={styles.routeCard}>
        <Text style={styles.routeTitle}>{tracking ? "Simulated route tracking" : "Route preview"}</Text>
        <Text style={styles.routeText}>📍 {pickup.name}</Text>
        <Text style={styles.routeArrow}>↓</Text>
        <Text style={styles.routeText}>🏁 {drop.name}</Text>
        {tracking ? (
          <View style={styles.telemetry}>
            <Text style={styles.telemetryText}>🚗 {speed} km/h · ETA {eta} min</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
            </View>
            <Text style={styles.disclaimer}>Demo route simulation — this does not show the driver's live GPS location.</Text>
          </View>
        ) : null}
        <Text style={styles.note}>Add a Google Maps key in src/config.ts and AndroidManifest.xml to see the map on Android.</Text>
      </View>
    );
  }
  const maps = require("react-native-maps");
  const MapView = maps.default;
  const Marker = maps.Marker;
  const Polyline = maps.Polyline;
  return (
    <View style={styles.wrap}>
      <MapView
        style={styles.map}
        region={{
          latitude: (pickup.latitude + drop.latitude) / 2,
          longitude: (pickup.longitude + drop.longitude) / 2,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        }}>
        <Polyline
          coordinates={[
            { latitude: pickup.latitude, longitude: pickup.longitude },
            { latitude: pickup.latitude + (drop.latitude - pickup.latitude) * 0.5, longitude: pickup.longitude + (drop.longitude - pickup.longitude) * 0.5 },
            { latitude: drop.latitude, longitude: drop.longitude },
          ]}
          strokeColor={colors.blue}
          strokeWidth={4}
        />
        <Marker coordinate={pickup} title={pickup.name} />
        <Marker coordinate={drop} title={drop.name} />
        {tracking ? <Marker coordinate={car} title="Simulated vehicle" pinColor={colors.blue} /> : null}
      </MapView>
      {tracking ? (
        <View style={styles.telemetry}>
          <Text style={styles.telemetryText}>🚗 Simulated route · {speed} km/h · ETA {eta} min</Text>
          <Text style={styles.disclaimer}>Demo route simulation — this does not show the driver's live GPS location.</Text>
        </View>
      ) : <Text style={styles.note}>Route preview · pickup and destination pins</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  map: { height: 180, borderRadius: 12 },
  routeCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: 12, padding: 14, marginBottom: 12 },
  routeTitle: { color: colors.ink, fontWeight: "700", marginBottom: 8 },
  routeText: { color: colors.ink, fontWeight: "600" },
  routeArrow: { color: colors.green, marginVertical: 2, marginLeft: 8 },
  note: { color: colors.muted, marginTop: 4 },
  telemetry: { marginTop: 8, padding: 10, borderRadius: 9, backgroundColor: colors.blueBg },
  telemetryText: { color: colors.blue, fontWeight: "700", fontSize: 13 },
  disclaimer: { color: colors.muted, fontSize: 11, marginTop: 5, lineHeight: 15 },
  progressTrack: { height: 6, backgroundColor: "#bfdbfe", borderRadius: 4, marginTop: 8, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: colors.blue, borderRadius: 4 },
});
