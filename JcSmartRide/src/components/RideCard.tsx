import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ride } from "../api/client";
import { colors } from "../theme";

type Props = {
  ride: Ride;
  score?: number;
  reasons?: string[];
  children?: React.ReactNode;
};

export default function RideCard({ ride, score, reasons, children }: Props) {
  const rating =
    ride.driver.average_rating == null ? "New driver" : ride.driver.average_rating.toFixed(1) + " stars";
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.main}>
          <Text style={styles.title}>
            {ride.pickup.name} to {ride.drop.name}
          </Text>
          <Text>
            {ride.ride_date} at {ride.ride_time}
            {ride.women_only ? " · Women-only" : ""}
          </Text>
          <Text>
            {ride.seats_available} seats · ₹{Math.round(ride.cost_per_seat)} · {ride.status}
          </Text>
          <Text style={styles.muted}>
            {ride.driver.name} · {rating}
          </Text>
        </View>
        {score != null && (
          <View style={styles.score}>
            <Text style={styles.scoreNumber}>{score}</Text>
            <Text style={styles.muted}>match</Text>
          </View>
        )}
      </View>
      {reasons?.map(reason => (
        <Text key={reason} style={styles.reason}>
          • {reason}
        </Text>
      ))}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  row: { flexDirection: "row", justifyContent: "space-between" },
  main: { flex: 1, paddingRight: 8 },
  title: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  muted: { color: colors.muted },
  score: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#e5f4ee",
    alignItems: "center",
    justifyContent: "center",
  },
  scoreNumber: { fontSize: 18, fontWeight: "700", color: colors.greenDark },
  reason: { marginTop: 4, color: colors.ink },
});
