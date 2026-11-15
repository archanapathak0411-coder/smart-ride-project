import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ride } from "../api/client";
import { colors } from "../theme";
import { callPhoneNumber } from "../utils/phone";

type Props = {
  ride: Ride;
  score?: number;
  reasons?: string[];
  children?: React.ReactNode;
};

function statusColors(status: string): { bg: string; text: string } {
  switch (status) {
    case "open":
      return { bg: colors.okBg, text: colors.okGreen };
    case "full":
      return { bg: colors.amberBg, text: colors.amber };
    case "cancelled":
      return { bg: colors.dangerBg, text: colors.danger };
    case "completed":
      return { bg: colors.blueBg, text: colors.blue };
    default:
      return { bg: colors.amberBg, text: colors.amber };
  }
}

export default function RideCard({ ride, score, reasons, children }: Props) {
  const rating =
    ride.driver.average_rating == null
      ? "New driver"
      : `${ride.driver.average_rating.toFixed(1)} ★`;

  const { bg: statusBg, text: statusText } = statusColors(ride.status);
  const driverLabel = ride.driver.branch
    ? `${ride.driver.name} (${ride.driver.branch})`
    : ride.driver.name;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        {/* Main content */}
        <View style={styles.main}>
          {/* Route row */}
          <View style={styles.routeRow}>
            <Text style={styles.routeText}>📍 {ride.pickup.name}</Text>
            <Text style={styles.routeArrow}> → </Text>
            <Text style={styles.routeText}>🏁 {ride.drop.name}</Text>
          </View>

          {/* Details row */}
          <View style={styles.detailsRow}>
            <Text style={styles.detail}>📅 <Text style={styles.bold}>{ride.ride_date}</Text> at <Text style={styles.bold}>{ride.ride_time}</Text></Text>
            <Text style={styles.detail}>💺 <Text style={styles.bold}>{ride.seats_available}/{ride.seats_total}</Text> seats left</Text>
            <Text style={styles.detail}>💰 <Text style={styles.bold}>₹{Math.round(ride.cost_per_seat)}</Text>/seat</Text>
            <Text style={styles.detail}>⭐ <Text style={styles.bold}>{driverLabel}</Text> · {rating}</Text>
            {ride.driver.phone ? (
              <Pressable onPress={() => callPhoneNumber(ride.driver.phone!)} accessibilityRole="link">
                <Text style={[styles.detail, styles.phone]}>📞 {ride.driver.phone}</Text>
              </Pressable>
            ) : null}
          </View>

          {/* Badge row */}
          <View style={styles.badgeRow}>
            {ride.status ? (
              <View style={[styles.badge, { backgroundColor: statusBg }]}>
                <Text style={[styles.badgeText, { color: statusText }]}>
                  {ride.status.toUpperCase()}
                </Text>
              </View>
            ) : null}
            {ride.women_only ? (
              <View style={[styles.badge, { backgroundColor: colors.purpleBg }]}>
                <Text style={[styles.badgeText, { color: colors.purple }]}>
                  👩 Women-only
                </Text>
              </View>
            ) : null}
          </View>

          {/* Match reasons */}
          {reasons && reasons.length > 0 ? (
            <View style={styles.reasonsContainer}>
              {reasons.map(reason => (
                <Text key={reason} style={styles.reason}>
                  • {reason}
                </Text>
              ))}
            </View>
          ) : null}

          {children}
        </View>

        {/* Match score badge */}
        {score != null ? (
          <View style={styles.score}>
            <Text style={styles.scoreNumber}>{score}</Text>
            <Text style={styles.scoreLabel}>MATCH</Text>
          </View>
        ) : null}
      </View>
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  row: { flexDirection: "row", alignItems: "flex-start" },
  main: { flex: 1, paddingRight: 8 },
  routeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    marginBottom: 8,
  },
  routeText: { fontSize: 15, fontWeight: "700", color: colors.ink },
  routeArrow: { fontSize: 15, color: colors.muted },
  detailsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10,
  },
  detail: { fontSize: 13, color: "#374151", marginRight: 10, marginBottom: 2 },
  phone: { color: colors.blue, textDecorationLine: "underline" },
  bold: { fontWeight: "700" },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 6 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginRight: 6,
    marginBottom: 4,
  },
  badgeText: { fontSize: 12, fontWeight: "600" },
  reasonsContainer: { marginTop: 4 },
  reason: { fontSize: 12, color: "#4b5563", marginBottom: 2 },
  score: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#e5f4ee",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  scoreNumber: { fontSize: 18, fontWeight: "700", color: colors.greenDark },
  scoreLabel: { fontSize: 10, fontWeight: "600", color: colors.okGreen, letterSpacing: 0.5 },
});
