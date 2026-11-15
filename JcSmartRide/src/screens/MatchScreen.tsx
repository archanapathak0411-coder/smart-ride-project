import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { api, Ride } from "../api/client";
import MapPreview from "../components/MapPreview";
import RideCard from "../components/RideCard";
import { RootStack } from "../navigation/types";
import { colors } from "../theme";

type Match = { score: number; reasons: string[]; ride: Ride };
type Props = NativeStackScreenProps<RootStack, "Match">;

export default function MatchScreen({ route }: Props) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [knnUsed, setKnnUsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    api("/api/rides/search", { method: "POST", body: route.params.search })
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
    try {
      await api("/api/bookings", {
        method: "POST",
        body: { ride_id: rideId, women_only: route.params.search.women_only },
      });
      setNote("Request sent. The driver can accept it from My Rides.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not request a seat");
    }
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.hint}>
        {knnUsed
          ? "Ranked with the match score and the KNN recommendation."
          : "Ranked with the match score. KNN needs at least two open rides."}
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {note ? <Text style={styles.ok}>{note}</Text> : null}
      {loading ? <Text>Looking for matching rides...</Text> : null}
      {!loading && matches.length === 0 && !error ? <Text>No open ride matched those filters.</Text> : null}
      {matches.map(match => (
        <View key={match.ride.id}>
          <RideCard ride={match.ride} score={match.score} reasons={match.reasons}>
            <Pressable style={styles.button} onPress={() => book(match.ride.id)}>
              <Text style={styles.buttonText}>Request seat</Text>
            </Pressable>
          </RideCard>
          <MapPreview pickup={match.ride.pickup} drop={match.ride.drop} />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.paper },
  content: { padding: 16 },
  hint: { color: colors.muted, marginBottom: 12 },
  button: { backgroundColor: colors.green, borderRadius: 20, padding: 10, marginTop: 8 },
  buttonText: { color: "white", textAlign: "center" },
  error: { color: colors.danger, marginBottom: 8 },
  ok: { color: colors.green, marginBottom: 8 },
});
