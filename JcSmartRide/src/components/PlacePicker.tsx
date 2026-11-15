import React, { useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Place } from "../api/client";
import { colors } from "../theme";

type Props = {
  label: string;
  places: Place[];
  value: string;
  onChange: (placeId: string) => void;
};

export default function PlacePicker({ label, places, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const selected = places.find(place => String(place.id) === String(value));

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.box} onPress={() => setOpen(true)}>
        <Text>{selected ? selected.name : "Choose a place"}</Text>
      </Pressable>
      <Modal visible={open} animationType="slide">
        <View style={styles.modal}>
          <Text style={styles.title}>{label}</Text>
          <FlatList
            data={places}
            keyExtractor={item => String(item.id)}
            renderItem={({ item }) => (
              <Pressable
                style={styles.row}
                onPress={() => {
                  onChange(String(item.id));
                  setOpen(false);
                }}>
                <Text>{item.name}</Text>
              </Pressable>
            )}
          />
          <Pressable style={styles.close} onPress={() => setOpen(false)}>
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  label: { marginBottom: 6, color: colors.ink },
  box: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    padding: 12,
    backgroundColor: colors.card,
  },
  modal: { flex: 1, padding: 20, backgroundColor: colors.paper },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
  row: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.line },
  close: { marginTop: 12, backgroundColor: colors.green, borderRadius: 20, padding: 12 },
  closeText: { color: "white", textAlign: "center" },
});
