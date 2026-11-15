import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import SearchForm from "../components/SearchForm";
import { useAuth } from "../context/AuthContext";
import { RootStack, SearchBody } from "../navigation/types";
import { colors } from "../theme";

type Props = NativeStackScreenProps<RootStack, "Home">;

export default function HomeScreen({ navigation }: Props) {
  const { user } = useAuth();

  function search(body: SearchBody) {
    if (!user) {
      navigation.navigate("Login");
      return;
    }
    navigation.navigate("Match", { search: body });
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>J.C. Bose University, YMCA Faridabad</Text>
      <Text style={styles.title}>Share the ride to campus.</Text>
      <Text style={styles.lead}>
        Drivers offer empty seats. Passengers get a match score based on route, time and cost.
      </Text>
      <View style={styles.row}>
        <Pressable style={styles.button} onPress={() => navigation.navigate("Find")}>
          <Text style={styles.buttonText}>Find Ride</Text>
        </Pressable>
        <Pressable style={styles.secondary} onPress={() => navigation.navigate("Offer")}>
          <Text style={styles.secondaryText}>Offer Ride</Text>
        </Pressable>
      </View>
      {!user && (
        <Pressable onPress={() => navigation.navigate("Login")}>
          <Text style={styles.link}>Login or sign up</Text>
        </Pressable>
      )}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Search</Text>
        <SearchForm womenOnlyDefault={Boolean(user?.women_only_preference)} onSearch={search} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.paper },
  content: { padding: 16 },
  eyebrow: { color: colors.green, textTransform: "uppercase", fontSize: 12 },
  title: { fontSize: 28, fontWeight: "700", marginVertical: 8 },
  lead: { color: colors.muted, marginBottom: 12 },
  row: { flexDirection: "row", gap: 8, marginBottom: 12 },
  button: { backgroundColor: colors.green, borderRadius: 20, paddingVertical: 10, paddingHorizontal: 16 },
  buttonText: { color: "white", fontWeight: "700" },
  secondary: {
    borderColor: colors.green,
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  secondaryText: { color: colors.greenDark, fontWeight: "700" },
  link: { color: colors.greenDark, marginBottom: 12 },
  card: { backgroundColor: colors.card, borderRadius: 12, padding: 14 },
  cardTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
});
