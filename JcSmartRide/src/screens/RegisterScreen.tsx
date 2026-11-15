import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import { RootStack } from "../navigation/types";
import { colors } from "../theme";

type Props = NativeStackScreenProps<RootStack, "Register">;

export default function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", phone: "", student_id: "", password: "" });
  const [error, setError] = useState("");

  function update(key: keyof typeof form, value: string) {
    setForm(current => ({ ...current, [key]: value }));
  }

  async function submit() {
    setError("");
    try {
      await register(form);
      navigation.replace("Home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not register");
    }
  }

  return (
    <View style={styles.page}>
      <Text style={styles.title}>Sign up</Text>
      <Text style={styles.hint}>Use your J.C. Bose University student ID.</Text>
      <TextInput style={styles.input} placeholder="Name" value={form.name} onChangeText={value => update("name", value)} />
      <TextInput style={styles.input} placeholder="Email" autoCapitalize="none" value={form.email} onChangeText={value => update("email", value)} />
      <TextInput style={styles.input} placeholder="Phone" keyboardType="phone-pad" value={form.phone} onChangeText={value => update("phone", value)} />
      <TextInput style={styles.input} placeholder="Student ID" autoCapitalize="characters" value={form.student_id} onChangeText={value => update("student_id", value)} />
      <TextInput style={styles.input} placeholder="Password (8+ characters)" secureTextEntry value={form.password} onChangeText={value => update("password", value)} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable style={styles.button} onPress={submit}>
        <Text style={styles.buttonText}>Create account</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, padding: 16, backgroundColor: colors.paper },
  title: { fontSize: 28, fontWeight: "700" },
  hint: { color: colors.muted, marginBottom: 12 },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  button: { backgroundColor: colors.green, borderRadius: 20, padding: 12 },
  buttonText: { color: "white", textAlign: "center", fontWeight: "700" },
  error: { color: colors.danger, marginBottom: 8 },
});
