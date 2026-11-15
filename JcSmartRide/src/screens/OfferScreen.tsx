import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { api, Place } from "../api/client";
import MapPreview from "../components/MapPreview";
import PlacePicker from "../components/PlacePicker";
import { useAuth } from "../context/AuthContext";
import { RootStack } from "../navigation/types";
import { colors } from "../theme";

type Props = NativeStackScreenProps<RootStack, "Offer">;

function today() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export default function OfferScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [places, setPlaces] = useState<Place[]>([]);
  const [pickup, setPickup] = useState("");
  const [drop, setDrop] = useState("");
  const [date, setDate] = useState(today());
  const [time, setTime] = useState("08:31");
  const [seats, setSeats] = useState("3");
  const [cost, setCost] = useState("40");
  const [womenOnly, setWomenOnly] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      navigation.replace("Login");
      return;
    }
    api("/api/places").then(data => setPlaces(data.places)).catch(err => setError(err.message));
  }, [navigation, user]);

  const pickupPlace = places.find(place => String(place.id) === pickup);
  const dropPlace = places.find(place => String(place.id) === drop);
  const blocked = user?.role === "student" && user.verification_status !== "verified";

  async function submit() {
    setError("");
    setMessage("");
    try {
      const data = await api("/api/rides", {
        method: "POST",
        body: {
          pickup_place_id: Number(pickup),
          drop_place_id: Number(drop),
          ride_date: date,
          ride_time: time,
          seats_total: Number(seats),
          cost_per_seat: Number(cost),
          women_only: womenOnly,
        },
      });
      setMessage("Ride offered: " + data.ride.pickup.name + " to " + data.ride.drop.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not offer the ride");
    }
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Offer a ride</Text>
      {blocked ? <Text style={styles.banner}>Wait for admin verification before offering a ride.</Text> : null}
      <PlacePicker label="Pickup" places={places} value={pickup} onChange={setPickup} />
      <PlacePicker label="Drop" places={places} value={drop} onChange={setDrop} />
      <TextInput style={styles.input} value={date} onChangeText={setDate} />
      <TextInput style={styles.input} value={time} onChangeText={setTime} />
      <TextInput style={styles.input} value={seats} keyboardType="number-pad" onChangeText={setSeats} />
      <TextInput style={styles.input} value={cost} keyboardType="number-pad" onChangeText={setCost} />
      <Pressable onPress={() => setWomenOnly(current => !current)}>
        <Text>{womenOnly ? "☑" : "☐"} Women-only ride</Text>
      </Pressable>
      <Text style={styles.hint}>Only passengers who tick women-only can see this ride.</Text>
      <MapPreview
        pickup={pickupPlace ? { ...pickupPlace, latitude: pickupPlace.latitude, longitude: pickupPlace.longitude } : undefined}
        drop={dropPlace}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {message ? <Text style={styles.ok}>{message}</Text> : null}
      <Pressable style={[styles.button, blocked && styles.disabled]} disabled={blocked} onPress={submit}>
        <Text style={styles.buttonText}>Offer ride</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.paper },
  content: { padding: 16 },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 12 },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  hint: { color: colors.muted, marginVertical: 8 },
  banner: { backgroundColor: "#fff4df", color: colors.amber, padding: 8, marginBottom: 8 },
  button: { backgroundColor: colors.green, borderRadius: 20, padding: 12, marginTop: 8 },
  buttonText: { color: "white", textAlign: "center", fontWeight: "700" },
  disabled: { opacity: 0.5 },
  error: { color: colors.danger },
  ok: { color: colors.green },
});
