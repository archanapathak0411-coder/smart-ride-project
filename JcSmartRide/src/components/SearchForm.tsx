import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { api, Place } from "../api/client";
import PlacePicker from "./PlacePicker";
import { colors } from "../theme";
import { SearchBody } from "../navigation/types";

type Props = {
  womenOnlyDefault?: boolean;
  onSearch: (body: SearchBody) => void;
};

function today() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export default function SearchForm({ womenOnlyDefault = false, onSearch }: Props) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [pickup, setPickup] = useState("");
  const [drop, setDrop] = useState("");
  const [date, setDate] = useState(today());
  const [time, setTime] = useState("08:30");
  const [womenOnly, setWomenOnly] = useState(womenOnlyDefault);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/places")
      .then(data => setPlaces(data.places))
      .catch(err => setError(err.message));
  }, []);

  return (
    <View>
      <PlacePicker label="Pickup" places={places} value={pickup} onChange={setPickup} />
      <PlacePicker label="Drop" places={places} value={drop} onChange={setDrop} />
      <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
      <TextInputLike value={date} onChange={setDate} />
      <Text style={styles.label}>Time (HH:MM)</Text>
      <TextInputLike value={time} onChange={setTime} />
      <Pressable style={styles.check} onPress={() => setWomenOnly(current => !current)}>
        <Text>{womenOnly ? "☑" : "☐"} Show women-only rides only</Text>
      </Pressable>
      <Text style={styles.hint}>
        Women-only rides appear only when this box is ticked. Other rides stay hidden while it is ticked.
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable
        style={styles.button}
        onPress={() => {
          if (!pickup || !drop) {
            setError("Choose a pickup and a drop.");
            return;
          }
          if (pickup === drop) {
            setError("Pickup and drop must be different places.");
            return;
          }
          setError("");
          onSearch({
            pickup_place_id: pickup,
            drop_place_id: drop,
            ride_date: date,
            ride_time: time,
            women_only: womenOnly,
            max_cost: null,
          });
        }}>
        <Text style={styles.buttonText}>Find rides</Text>
      </Pressable>
    </View>
  );
}

function TextInputLike({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <TextInput style={styles.input} value={value} onChangeText={onChange} />;
}

const styles = StyleSheet.create({
  label: { marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: colors.card,
  },
  check: { marginBottom: 8 },
  hint: { color: colors.muted, marginBottom: 12 },
  error: { color: colors.danger, marginBottom: 8 },
  button: { backgroundColor: colors.green, borderRadius: 20, padding: 12 },
  buttonText: { color: "white", textAlign: "center", fontWeight: "700" },
});
