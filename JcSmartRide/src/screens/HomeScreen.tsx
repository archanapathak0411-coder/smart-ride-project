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
      navigation.navigate("Login", { search: body });
      return;
    }
    navigation.navigate("Match", { search: body });
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>🎓 J.C. Bose University · YMCA Faridabad</Text>
        <Text style={styles.title}>Your campus ride, made smarter.</Text>
        <Text style={styles.lead}>
          Find or offer a ride with fellow students. Share costs, save time, and make the commute greener.
        </Text>
        <View style={styles.row}>
          <Pressable style={styles.button} onPress={() => navigation.navigate("Find")}>
            <Text style={styles.buttonText}>Find a ride　→</Text>
          </Pressable>
          <Pressable style={styles.secondary} onPress={() => navigation.navigate("Offer")}>
            <Text style={styles.secondaryText}>Offer a ride</Text>
          </Pressable>
        </View>
        {!user ? (
          <Pressable style={styles.signupLink} onPress={() => navigation.navigate("Register")}>
            <Text style={styles.signupText}>New here? Create your student account</Text>
          </Pressable>
        ) : (
          <Text style={styles.welcome}>Welcome back, {user.name.split(" ")[0]}.</Text>
        )}
      </View>
      {user?.role === "student" && user.verification_status !== "verified" ? (
        <View style={styles.verificationBanner}>
          <Text style={styles.verificationTitle}>Student verification: {user.verification_status}</Text>
          <Text style={styles.verificationText}>Ride booking and offering unlock after approval. Upload or replace your ID photo from the Menu → Check ID status.</Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Find your next campus ride</Text>
        <Text style={styles.cardSub}>Choose your route, date and time to see ranked matches.</Text>
        <SearchForm compact womenOnlyDefault={Boolean(user?.women_only_preference)} onSearch={search} />
      </View>

      <Text style={styles.sectionTitle}>A better way to get to campus</Text>
      <View style={styles.features}>
        <Feature icon="💰" title="Save on travel" text="Share fuel costs with students on your route." />
        <Feature icon="🛡️" title="Campus community" text="Verified student accounts help build trust." />
        <Feature icon="🌿" title="Travel greener" text="Fewer solo vehicles on the road." />
      </View>

      <View style={styles.howCard}>
        <Text style={styles.sectionTitle}>Three simple steps</Text>
        <Text style={styles.step}>1　Create or sign in to your student account</Text>
        <Text style={styles.step}>2　Find a ride or offer your available seats</Text>
        <Text style={styles.step}>3　Confirm the booking and travel together</Text>
      </View>
    </ScrollView>
  );
}

function Feature({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <View style={styles.feature}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.paper },
  content: { padding: 16, paddingBottom: 36, gap: 16 },
  hero: { backgroundColor: colors.greenDark, borderRadius: 20, padding: 22 },
  eyebrow: { color: "#b7f7d8", textTransform: "uppercase", fontSize: 11, fontWeight: "700", letterSpacing: 0.6 },
  title: { fontSize: 32, fontWeight: "800", color: "white", marginVertical: 10, lineHeight: 38 },
  lead: { color: "#e7f6ef", marginBottom: 18, lineHeight: 21, fontSize: 14 },
  row: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  button: { backgroundColor: "#22c55e", borderRadius: 24, paddingVertical: 12, paddingHorizontal: 17 },
  buttonText: { color: "white", fontWeight: "800" },
  secondary: {
    borderColor: "rgba(255,255,255,0.65)",
    borderWidth: 1,
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 17,
  },
  secondaryText: { color: "white", fontWeight: "700" },
  signupLink: { marginTop: 16 },
  signupText: { color: "#d1fae5", fontSize: 13, fontWeight: "600" },
  welcome: { color: "#d1fae5", marginTop: 15, fontWeight: "600" },
  verificationBanner: { backgroundColor: colors.amberBg, borderColor: "#fde68a", borderWidth: 1, borderRadius: 12, padding: 12 },
  verificationTitle: { color: colors.amber, fontWeight: "800", marginBottom: 3 },
  verificationText: { color: colors.amber, fontSize: 12, lineHeight: 18 },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.line },
  cardTitle: { fontSize: 19, fontWeight: "800", color: colors.ink, marginBottom: 3 },
  cardSub: { color: colors.muted, fontSize: 13, marginBottom: 12 },
  sectionTitle: { fontSize: 19, fontWeight: "800", color: colors.ink, marginBottom: 8 },
  features: { gap: 9 },
  feature: { backgroundColor: colors.card, borderRadius: 13, padding: 14, borderWidth: 1, borderColor: colors.line },
  featureIcon: { fontSize: 23, marginBottom: 5 },
  featureTitle: { color: colors.ink, fontWeight: "800", marginBottom: 3 },
  featureText: { color: colors.muted, fontSize: 13 },
  howCard: { backgroundColor: colors.okBg, borderRadius: 15, padding: 16 },
  step: { color: colors.ink, marginTop: 7, lineHeight: 20 },
});
