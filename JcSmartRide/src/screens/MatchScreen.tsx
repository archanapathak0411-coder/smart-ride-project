import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { requestBooking, searchRides, Ride } from "../api/client";
import { useAuth } from "../context/AuthContext";
import MapPreview from "../components/MapPreview";
import RideCard from "../components/RideCard";
import { RootStack } from "../navigation/types";
import { colors } from "../theme";

type Match = { score: number; reasons: string[]; ride: Ride };
type Props = NativeStackScreenProps<RootStack, "Match">;

export default function MatchScreen({ route, navigation }: Props) {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [knnUsed, setKnnUsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [bookingRideId, setBookingRideId] = useState<number | null>(null);
  const [mapRideId, setMapRideId] = useState<number | null>(null);

  useEffect(() => {
    searchRides(route.params.search)
      .then(data => {
        setMatches(data.matches);
        setKnnUsed(data.knn_used);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [route.params.search]);

  async function book(rideId: number) {
    setError("");
    setNote("");
    setBookingRideId(rideId);
    try {
      await requestBooking({ ride_id: rideId, women_only: route.params.search.women_only });
      setNote("Request sent. The driver can accept it from My Rides.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not request a seat");
    } finally {
      setBookingRideId(null);
    }
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Smart match results</Text>
      <Text style={styles.hint}>
        {knnUsed
          ? "Ranked with the match score and the KNN recommendation."
          : "Ranked with the match score. KNN needs at least two open rides."}
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {note ? <Text style={styles.ok}>{note}</Text> : null}
      {loading ? (
        <View style={styles.loading}><ActivityIndicator color={colors.green} /><Text style={styles.hint}>Finding matching campus rides…</Text></View>
      ) : null}
      {!loading && matches.length === 0 && !error ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>🚗</Text>
          <Text style={styles.emptyTitle}>No matching rides found</Text>
          <Text style={styles.hint}>Try a different route, time, date, or maximum fare—or offer a ride on this route.</Text>
        </View>
      ) : null}
      {matches.map(match => (
        <View key={match.ride.id} style={styles.matchCard}>
          <View style={styles.fareBanner}>
            <Text style={styles.fareText}>Fare ₹{Math.round(match.ride.cost_per_seat)} per seat · Solo auto ~₹{Math.round(match.ride.cost_per_seat * 2.2)}</Text>
            <Text style={styles.savingsText}>Save ~₹{Math.max(25, Math.round(match.ride.cost_per_seat * 1.2))}</Text>
          </View>
          <RideCard ride={match.ride} score={match.score} reasons={match.reasons}>
            {user?.id === match.ride.driver.id ? (
              <Pressable onPress={() => navigation.navigate("MyRides")}>
                <Text style={styles.ownRideLink}>This is your ride · Manage in My Rides →</Text>
              </Pressable>
            ) : user?.role === "student" && user.verification_status !== "verified" ? (
              <Text style={styles.mutedAction}>Account verification is required before requesting a seat.</Text>
            ) : (
              <Pressable
                style={[styles.button, bookingRideId === match.ride.id && styles.disabled]}
                onPress={() => book(match.ride.id)}
                disabled={bookingRideId === match.ride.id}>
                {bookingRideId === match.ride.id ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Request a seat</Text>}
              </Pressable>
            )}
            <Pressable style={styles.mapButton} onPress={() => setMapRideId(mapRideId === match.ride.id ? null : match.ride.id)}>
              <Text style={styles.mapButtonText}>{mapRideId === match.ride.id ? "Hide route preview" : "Preview route"}</Text>
            </Pressable>
          </RideCard>
          {mapRideId === match.ride.id ? (
            <MapPreview pickup={match.ride.pickup} drop={match.ride.drop} tracking />
          ) : null}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.paper },
  content: { padding: 16 },
  title: { fontSize: 26, fontWeight: "800", color: colors.ink, marginBottom: 4 },
  hint: { color: colors.muted, marginBottom: 12, lineHeight: 19 },
  loading: { alignItems: "center", gap: 8, padding: 24 },
  emptyCard: { backgroundColor: colors.card, borderRadius: 14, padding: 22, alignItems: "center", marginVertical: 12 },
  emptyIcon: { fontSize: 34, marginBottom: 8 },
  emptyTitle: { color: colors.ink, fontSize: 18, fontWeight: "800", marginBottom: 6 },
  matchCard: { backgroundColor: colors.card, borderRadius: 14, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: colors.line },
  fareBanner: { backgroundColor: colors.okBg, borderRadius: 9, padding: 10, marginBottom: 8, gap: 3 },
  fareText: { color: colors.okGreen, fontSize: 12, fontWeight: "600" },
  savingsText: { color: colors.okGreen, fontWeight: "800", fontSize: 13 },
  button: { backgroundColor: colors.green, borderRadius: 10, padding: 11, marginTop: 8, minHeight: 42, justifyContent: "center" },
  buttonText: { color: "white", textAlign: "center", fontWeight: "700" },
  mapButton: { backgroundColor: colors.card, borderColor: colors.green, borderWidth: 1, borderRadius: 10, padding: 10, marginTop: 8 },
  mapButtonText: { color: colors.green, textAlign: "center", fontWeight: "700" },
  mutedAction: { color: colors.muted, fontSize: 13, marginTop: 10 },
  ownRideLink: { color: colors.blue, fontWeight: "700", fontSize: 13, marginTop: 10 },
  disabled: { opacity: 0.6 },
  error: { color: colors.danger, marginBottom: 8 },
  ok: { color: colors.okGreen, backgroundColor: colors.okBg, padding: 10, borderRadius: 8, marginBottom: 8 },
});
