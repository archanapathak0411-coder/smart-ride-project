import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import SearchForm from "../components/SearchForm";
import { useAuth } from "../context/AuthContext";
import { RootStack, SearchBody } from "../navigation/types";
import { colors } from "../theme";

type Props = NativeStackScreenProps<RootStack, "Find">;

const INFO_CARDS = [
  {
    emoji: "📍",
    title: "Multiple Faridabad Hubs",
    desc: "Pick from campus, sector hubs & nearby stops across Faridabad.",
  },
  {
    emoji: "🤖",
    title: "Smart Match Score",
    desc: "0–100% score via KNN: time, route, cost and preferences all weighed.",
  },
  {
    emoji: "⛽",
    title: "Save 60%+ on Fuel",
    desc: "Split auto costs with fellow students and cut your daily commute bill.",
  },
];

export default function FindScreen({ navigation }: Props) {
  const { user } = useAuth();

  function search(body: SearchBody) {
    if (!user) {
      navigation.navigate("Login", { search: body });
      return;
    }
    navigation.navigate("Match", { search: body });
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🔍 Find a Campus Ride</Text>
        <Text style={styles.subtitle}>
          AI smart matcher finds the best student rides for you
        </Text>
      </View>

      {/* Search Form */}
      <SearchForm
        womenOnlyDefault={Boolean(user?.women_only_preference)}
        onSearch={search}
      />

      {/* Info Cards */}
      <View style={styles.cardsRow}>
        {INFO_CARDS.map(card => (
          <View key={card.title} style={styles.card}>
            <Text style={styles.cardEmoji}>{card.emoji}</Text>
            <Text style={styles.cardTitle}>{card.title}</Text>
            <Text style={styles.cardDesc}>{card.desc}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.paper },
  content: { padding: 16, paddingBottom: 32 },

  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.ink,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
  },

  cardsRow: {
    marginTop: 20,
    gap: 12,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardEmoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.ink,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    color: colors.muted,
    lineHeight: 18,
  },
});
