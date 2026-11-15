import React from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import SearchForm from "../components/SearchForm";
import { useAuth } from "../context/AuthContext";
import { RootStack, SearchBody } from "../navigation/types";
import { colors } from "../theme";

type Props = NativeStackScreenProps<RootStack, "Find">;

export default function FindScreen({ navigation }: Props) {
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
      <Text style={styles.title}>Find a ride</Text>
      <SearchForm womenOnlyDefault={Boolean(user?.women_only_preference)} onSearch={search} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.paper },
  content: { padding: 16 },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 12 },
});
