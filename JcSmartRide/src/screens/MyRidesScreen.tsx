import React, { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { api, Ride } from "../api/client";
import RideCard from "../components/RideCard";
import { useAuth } from "../context/AuthContext";
import { RootStack } from "../navigation/types";
import { colors } from "../theme";

type Booking = {
  id: number;
  status: string;
  can_rate: boolean;
  my_rating: number | null;
  ride: Ride;
};

type Props = NativeStackScreenProps<RootStack, "MyRides">;

export default function MyRidesScreen({ navigation }: Props) {
  const { user, saveProfile } = useAuth();
  const [tab, setTab] = useState("upcoming");
  const [offered, setOffered] = useState<Ride[]>([]);
  const [joined, setJoined] = useState<Booking[]>([]);
  const [saved, setSaved] = useState<number | null>(null);
  const [fare, setFare] = useState(user?.typical_solo_fare ? String(user.typical_solo_fare) : "");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!user) {
      navigation.replace("Login");
      return;
    }
    try {
      const [rides, bookings, savings] = await Promise.all([
        api("/api/rides/mine"),
        api("/api/bookings/mine"),
        api("/api/savings"),
      ]);
      setOffered(rides.rides);
      setJoined(bookings.bookings);
      setSaved(savings.saved);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load rides");
    }
  }, [navigation, user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function run(path: string) {
    try {
      await api(path, { method: "POST" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    }
  }

  const offeredVisible = offered.filter(ride => groupStatus(ride.status) === tab);
  const joinedVisible = joined.filter(booking => groupBooking(booking) === tab);

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.title}>My rides</Text>
      <Text style={styles.savings}>
        {saved == null ? "Set a solo fare to see savings." : "Saved this month: ₹" + Math.round(saved)}
      </Text>
      <View style={styles.row}>
        <TextInput style={styles.input} value={fare} keyboardType="number-pad" onChangeText={setFare} placeholder="Solo fare" />
        <Pressable
          style={styles.small}
          onPress={() => saveProfile({ typical_solo_fare: fare === "" ? null : Number(fare) }).then(load)}>
          <Text style={styles.smallText}>Save</Text>
        </Pressable>
      </View>
      <View style={styles.row}>
        {["upcoming", "completed", "cancelled"].map(name => (
          <Pressable key={name} style={tab === name ? styles.tabOn : styles.tab} onPress={() => setTab(name)}>
            <Text style={tab === name ? styles.tabOnText : styles.tabText}>{name}</Text>
          </Pressable>
        ))}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Text style={styles.heading}>Rides I offered</Text>
      {offeredVisible.map(ride => (
        <RideCard key={ride.id} ride={ride}>
          {(ride.status === "open" || ride.status === "full") && (
            <View style={styles.row}>
              <Pressable style={styles.small} onPress={() => run("/api/rides/" + ride.id + "/cancel")}>
                <Text style={styles.smallText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.small} onPress={() => run("/api/rides/" + ride.id + "/complete")}>
                <Text style={styles.smallText}>Complete</Text>
              </Pressable>
            </View>
          )}
          {ride.bookings?.map(booking => (
            <View key={booking.id} style={styles.request}>
              <Text>
                {booking.passenger.name} · {booking.status}
              </Text>
              {booking.status === "pending" && (
                <View style={styles.row}>
                  <Pressable style={styles.small} onPress={() => run("/api/bookings/" + booking.id + "/accept")}>
                    <Text style={styles.smallText}>Accept</Text>
                  </Pressable>
                  <Pressable style={styles.small} onPress={() => run("/api/bookings/" + booking.id + "/reject")}>
                    <Text style={styles.smallText}>Reject</Text>
                  </Pressable>
                </View>
              )}
            </View>
          ))}
        </RideCard>
      ))}
      <Text style={styles.heading}>Rides I joined</Text>
      {joinedVisible.map(booking => (
        <RideCard key={booking.id} ride={booking.ride}>
          <Text>Your request is {booking.status}.</Text>
          {(booking.status === "pending" || booking.status === "accepted") && (
            <Pressable style={styles.small} onPress={() => run("/api/bookings/" + booking.id + "/cancel")}>
              <Text style={styles.smallText}>Cancel request</Text>
            </Pressable>
          )}
          {booking.can_rate && (
            <Pressable
              style={styles.small}
              onPress={() =>
                api("/api/ratings", { method: "POST", body: { booking_id: booking.id, stars: 5, comment: "Good ride" } }).then(load)
              }>
              <Text style={styles.smallText}>Rate 5 stars</Text>
            </Pressable>
          )}
        </RideCard>
      ))}
    </ScrollView>
  );
}

function groupStatus(status: string) {
  if (status === "cancelled") return "cancelled";
  if (status === "completed") return "completed";
  return "upcoming";
}

function groupBooking(booking: Booking) {
  if (booking.status === "cancelled" || booking.status === "rejected") return "cancelled";
  if (booking.status === "completed" || booking.ride.status === "completed") return "completed";
  return "upcoming";
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.paper },
  content: { padding: 16 },
  title: { fontSize: 28, fontWeight: "700" },
  heading: { fontSize: 18, fontWeight: "700", marginVertical: 8 },
  savings: { marginVertical: 8, fontSize: 16 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  input: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    padding: 10,
  },
  tab: { borderWidth: 1, borderColor: colors.line, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6 },
  tabOn: { backgroundColor: colors.green, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6 },
  tabText: { textTransform: "capitalize" },
  tabOnText: { color: "white", textTransform: "capitalize" },
  small: { backgroundColor: colors.green, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
  smallText: { color: "white" },
  request: { marginTop: 8 },
  error: { color: colors.danger },
});
