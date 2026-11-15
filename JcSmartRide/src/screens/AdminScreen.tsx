import React, { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { RootStack } from "../navigation/types";
import { colors } from "../theme";

type Props = NativeStackScreenProps<RootStack, "Admin">;

export default function AdminScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [students, setStudents] = useState<Array<{ id: number; name: string; email: string; student_id: string; verification_status: string }>>([]);
  const [rides, setRides] = useState<Array<{ id: number; status: string; driver: { name: string }; pickup: { name: string }; drop: { name: string } }>>([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!user || user.role !== "admin") {
      navigation.replace("Home");
      return;
    }
    try {
      const [studentData, rideData] = await Promise.all([api("/api/admin/students"), api("/api/admin/rides")]);
      setStudents(studentData.students);
      setRides(rideData.rides);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load admin data");
    }
  }, [navigation, user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function act(path: string) {
    try {
      await api(path, { method: "POST" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    }
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Admin</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Text style={styles.heading}>Students</Text>
      {students.map(student => (
        <View key={student.id} style={styles.card}>
          <Text style={styles.name}>{student.name}</Text>
          <Text>
            {student.student_id} · {student.verification_status}
          </Text>
          <View style={styles.row}>
            <Pressable style={styles.button} onPress={() => act("/api/admin/students/" + student.id + "/verify")}>
              <Text style={styles.buttonText}>Verify</Text>
            </Pressable>
            <Pressable style={styles.button} onPress={() => act("/api/admin/students/" + student.id + "/reject")}>
              <Text style={styles.buttonText}>Reject</Text>
            </Pressable>
          </View>
        </View>
      ))}
      <Text style={styles.heading}>Rides</Text>
      {rides.map(ride => (
        <View key={ride.id} style={styles.card}>
          <Text>
            {ride.driver.name}: {ride.pickup.name} to {ride.drop.name} · {ride.status}
          </Text>
          {ride.status !== "cancelled" && ride.status !== "completed" && (
            <Pressable style={styles.button} onPress={() => act("/api/admin/rides/" + ride.id + "/cancel")}>
              <Text style={styles.buttonText}>Cancel ride</Text>
            </Pressable>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.paper },
  content: { padding: 16 },
  title: { fontSize: 28, fontWeight: "700" },
  heading: { fontSize: 18, fontWeight: "700", marginVertical: 8 },
  card: { backgroundColor: colors.card, borderRadius: 12, padding: 12, marginBottom: 8 },
  name: { fontWeight: "700" },
  row: { flexDirection: "row", gap: 8, marginTop: 8 },
  button: { backgroundColor: colors.green, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, marginTop: 8 },
  buttonText: { color: "white" },
  error: { color: colors.danger },
});
