import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { GOOGLE_MAPS_API_KEY } from "../config";
import { colors } from "../theme";

type Point = { latitude: number; longitude: number; name: string };

type Props = {
  pickup?: Point;
  drop?: Point;
};

// The place list is enough to book a ride. The map is extra, and only
// appears after a Google Maps key is pasted into src/config.ts.
export default function MapPreview({ pickup, drop }: Props) {
  if (!GOOGLE_MAPS_API_KEY || !pickup || !drop) {
    return null;
  }
  const maps = require("react-native-maps");
  const MapView = maps.default;
  const Marker = maps.Marker;
  return (
    <View style={styles.wrap}>
      <MapView
        style={styles.map}
        provider={maps.PROVIDER_GOOGLE}
        initialRegion={{
          latitude: (pickup.latitude + drop.latitude) / 2,
          longitude: (pickup.longitude + drop.longitude) / 2,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        }}>
        <Marker coordinate={pickup} title={pickup.name} />
        <Marker coordinate={drop} title={drop.name} />
      </MapView>
      <Text style={styles.note}>Map key is set. Pins show the pickup and drop.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  map: { height: 180, borderRadius: 12 },
  note: { color: colors.muted, marginTop: 4 },
});
