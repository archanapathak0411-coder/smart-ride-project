import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { calculateFare, createRide, FareQuote, getPlaces, Place } from "../api/client";
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
  const [fareQuote, setFareQuote] = useState<FareQuote | null>(null);
  const [fareLoading, setFareLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigation.replace("Login", { next: "Offer" });
      return;
    }
    getPlaces().then(data => setPlaces(data.places)).catch(err => setError(err.message));
  }, [navigation, user]);

  useEffect(() => {
    let active = true;
    if (!pickup || !drop || pickup === drop) {
      setFareQuote(null);
      setFareLoading(false);
      return () => { active = false; };
    }

    setFareLoading(true);
    calculateFare({ pickup_place_id: pickup, drop_place_id: drop })
      .then((quote: FareQuote) => {
        if (!active) return;
        setFareQuote(quote);
        setCost(String(quote.recommended_fare));
      })
      .catch(err => {
        if (active) {
          setFareQuote(null);
          setError(err instanceof Error ? err.message : "Could not calculate a fare");
        }
      })
      .finally(() => {
        if (active) setFareLoading(false);
      });

    return () => { active = false; };
  }, [pickup, drop]);

  const pickupPlace = places.find(place => String(place.id) === pickup);
  const dropPlace = places.find(place => String(place.id) === drop);
  const blocked = user?.role === "student" && user.verification_status !== "verified";

  async function submit() {
    setError("");
    setMessage("");
    if (!pickup || !drop) {
      setError("Choose both a pickup and a destination.");
      return;
    }
    if (pickup === drop) {
      setError("Pickup and destination must be different places.");
      return;
    }
    if (date < today() || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setError("Choose a valid ride date that is today or later.");
      return;
    }
    if (!/^\d{2}:\d{2}$/.test(time)) {
      setError("Enter a departure time in HH:MM format.");
      return;
    }
    const seatCount = Number(seats);
    const fare = Number(cost);
    if (!Number.isInteger(seatCount) || seatCount < 1 || seatCount > 6) {
      setError("Available seats must be between 1 and 6.");
      return;
    }
    if (!Number.isFinite(fare) || fare < 0 || fare > 5000) {
      setError("Fare per seat must be between ₹0 and ₹5,000.");
      return;
    }
    setSubmitting(true);
    try {
      const data = await createRide({
        pickup_place_id: Number(pickup),
        drop_place_id: Number(drop),
        ride_date: date,
        ride_time: time,
        seats_total: seatCount,
        cost_per_seat: fare,
        women_only: womenOnly,
      });
      setMessage("Ride offered: " + data.ride.pickup.name + " to " + data.ride.drop.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not offer the ride");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.intro}>
        <Text style={styles.eyebrow}>Share the journey</Text>
        <Text style={styles.title}>Offer a campus ride</Text>
        <Text style={styles.subtitle}>Set your route and departure details. We’ll suggest a fair student fuel share.</Text>
      </View>
      {blocked ? <Text style={styles.banner}>Your account is {user?.verification_status}. Wait for admin verification before offering a ride.</Text> : null}
      <PlacePicker label="Pickup" places={places} value={pickup} onChange={setPickup} />
      <PlacePicker label="Drop" places={places} value={drop} onChange={setDrop} />
      <View style={styles.row}>
        <View style={styles.half}>
          <Text style={styles.label}>Ride date (YYYY-MM-DD)</Text>
          <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="2026-11-15" />
        </View>
        <View style={styles.half}>
          <Text style={styles.label}>Departure (HH:MM)</Text>
          <TextInput style={styles.input} value={time} onChangeText={setTime} placeholder="08:30" />
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.half}>
          <Text style={styles.label}>Available seats (1–6)</Text>
          <TextInput style={styles.input} value={seats} keyboardType="number-pad" onChangeText={setSeats} />
        </View>
        <View style={styles.half}>
          <Text style={styles.label}>Fare per seat (₹)</Text>
          <TextInput style={styles.input} value={cost} keyboardType="decimal-pad" onChangeText={setCost} />
        </View>
      </View>
      {fareLoading ? (
        <View style={styles.quoteLoading}><ActivityIndicator color={colors.blue} /><Text style={styles.quoteLoadingText}>Calculating recommended fare…</Text></View>
      ) : null}
      {fareQuote ? (
        <View style={styles.quoteCard}>
          <Text style={styles.quoteTitle}>Suggested fare: ₹{fareQuote.recommended_fare} per seat</Text>
          <Text style={styles.quoteText}>{fareQuote.road_distance_km} km · about {fareQuote.estimated_duration_mins} min</Text>
          <Text style={styles.quoteText}>Suggested range ₹{fareQuote.fare_range.min}–₹{fareQuote.fare_range.max} · Solo auto ₹{fareQuote.solo_auto_fare} · Solo cab ₹{fareQuote.solo_cab_fare}</Text>
          <Text style={styles.quoteSavings}>Save about ₹{fareQuote.savings_vs_auto} vs a solo auto</Text>
        </View>
      ) : null}
      <Pressable style={styles.preference} onPress={() => setWomenOnly(current => !current)}>
        <Text style={styles.preferenceIcon}>{womenOnly ? "☑" : "☐"}</Text>
        <View style={styles.preferenceCopy}>
          <Text style={styles.preferenceTitle}>Women-only ride</Text>
          <Text style={styles.hint}>Only passengers who also select women-only will see this ride.</Text>
        </View>
      </Pressable>
      <MapPreview
        pickup={pickupPlace}
        drop={dropPlace}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {message ? <Text style={styles.ok}>{message}</Text> : null}
      {message ? (
        <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate("MyRides")}>
          <Text style={styles.secondaryButtonText}>Manage my rides</Text>
        </Pressable>
      ) : null}
      <Pressable style={[styles.button, (blocked || submitting) && styles.disabled]} disabled={blocked || submitting} onPress={submit}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Publish ride</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.paper },
  content: { padding: 16, paddingBottom: 36 },
  intro: { marginBottom: 16 },
  eyebrow: { color: colors.green, fontWeight: "700", fontSize: 12, textTransform: "uppercase" },
  title: { fontSize: 28, fontWeight: "800", color: colors.ink, marginTop: 4 },
  subtitle: { color: colors.muted, marginTop: 4, lineHeight: 20 },
  label: { color: colors.ink, fontSize: 13, fontWeight: "600", marginBottom: 5 },
  row: { flexDirection: "row", gap: 10 },
  half: { flex: 1 },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    color: colors.ink,
  },
  hint: { color: colors.muted, fontSize: 12, marginTop: 2, lineHeight: 17 },
  banner: { backgroundColor: colors.amberBg, color: colors.amber, padding: 12, borderRadius: 10, marginBottom: 14 },
  quoteLoading: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  quoteLoadingText: { color: colors.muted, fontSize: 13 },
  quoteCard: { backgroundColor: colors.blueBg, borderColor: "#bfdbfe", borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 12 },
  quoteTitle: { color: colors.blue, fontWeight: "800", marginBottom: 4 },
  quoteText: { color: "#1e3a8a", fontSize: 12, lineHeight: 18 },
  quoteSavings: { color: colors.okGreen, fontWeight: "700", marginTop: 4 },
  preference: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 12, backgroundColor: colors.card, borderRadius: 10, marginBottom: 14 },
  preferenceIcon: { color: colors.purple, fontSize: 18 },
  preferenceCopy: { flex: 1 },
  preferenceTitle: { color: colors.ink, fontWeight: "700" },
  button: { backgroundColor: colors.green, borderRadius: 12, padding: 14, marginTop: 8, minHeight: 48, justifyContent: "center" },
  buttonText: { color: "white", textAlign: "center", fontWeight: "700", fontSize: 15 },
  secondaryButton: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.green, borderRadius: 12, padding: 12, marginTop: 8 },
  secondaryButtonText: { color: colors.green, textAlign: "center", fontWeight: "700" },
  disabled: { opacity: 0.5 },
  error: { color: colors.danger },
  ok: { color: colors.okGreen, backgroundColor: colors.okBg, padding: 10, borderRadius: 8 },
});
