import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import { RootStack } from "../navigation/types";
import { colors } from "../theme";
import { pickStudentIdPhoto } from "../utils/photo";

type Props = NativeStackScreenProps<RootStack, "Register">;

const BRANCHES = [
  "Computer Engineering",
  "Information Technology",
  "Electronics & Communication (ECE)",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Master of Computer Applications (MCA)",
  "Master of Business Administration (MBA)",
  "Physics / Chemistry / Mathematics",
  "Other Department",
];

export default function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    student_id: "",
    branch: BRANCHES[0],
    password: "",
    id_card_photo: null as string | null,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [branchPickerOpen, setBranchPickerOpen] = useState(false);

  function update(key: keyof typeof form, value: string | null) {
    setForm(current => ({ ...current, [key]: value }));
  }

  async function selectPhoto() {
    setError("");
    try {
      const photo = await pickStudentIdPhoto();
      if (photo) update("id_card_photo", photo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not select the ID photo");
    }
  }

  async function submit() {
    setError("");
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() ||
        !form.student_id.trim() || !form.password) {
      setError("Please complete all required fields.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      await register(form);
      navigation.replace("Home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not register");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <Text style={styles.eyebrow}>JC SmartRide · Student account</Text>
        <Text style={styles.title}>Join your campus ride community</Text>
        <Text style={styles.hint}>Use your J.C. Bose University details. Your account will be reviewed by an admin.</Text>

        <Text style={styles.label}>Full name</Text>
        <TextInput style={styles.input} placeholder="Your full name" value={form.name} onChangeText={value => update("name", value)} autoCapitalize="words" />
        <Text style={styles.label}>College email</Text>
        <TextInput style={styles.input} placeholder="you@jcbose.ac.in" keyboardType="email-address" autoCapitalize="none" value={form.email} onChangeText={value => update("email", value)} />
        <View style={styles.row}>
          <View style={styles.half}>
            <Text style={styles.label}>Mobile phone</Text>
            <TextInput style={styles.input} placeholder="10-digit number" keyboardType="phone-pad" value={form.phone} onChangeText={value => update("phone", value)} />
          </View>
          <View style={styles.half}>
            <Text style={styles.label}>Student ID / roll no.</Text>
            <TextInput style={styles.input} placeholder="YM2022105" autoCapitalize="characters" value={form.student_id} onChangeText={value => update("student_id", value)} />
          </View>
        </View>

        <Text style={styles.label}>Academic department / branch</Text>
        <Pressable style={styles.input} onPress={() => setBranchPickerOpen(true)}>
          <Text style={styles.inputText}>{form.branch}　⌄</Text>
        </Pressable>

        <Text style={styles.label}>Student ID card photo (optional)</Text>
        <Text style={styles.hintSmall}>Attach a clear image to help the admin verify your account sooner. Maximum 2 MB.</Text>
        <View style={styles.photoRow}>
          <Pressable style={styles.photoButton} onPress={selectPhoto}>
            <Text style={styles.photoButtonText}>{form.id_card_photo ? "Change ID photo" : "Choose ID photo"}</Text>
          </Pressable>
          <Text style={styles.photoStatus}>{form.id_card_photo ? "Photo attached ✓" : "No photo selected"}</Text>
        </View>
        {form.id_card_photo ? <Image source={{ uri: form.id_card_photo }} style={styles.preview} resizeMode="contain" /> : null}

        <Text style={styles.label}>Create password</Text>
        <TextInput style={styles.input} placeholder="At least 8 characters" secureTextEntry value={form.password} onChangeText={value => update("password", value)} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable style={[styles.button, loading && styles.disabled]} onPress={submit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create student account</Text>}
        </Pressable>
        <Pressable style={styles.loginLink} onPress={() => navigation.navigate("Login")}>
          <Text style={styles.loginText}>Already registered? <Text style={styles.loginBold}>Log in</Text></Text>
        </Pressable>
      </View>

      <Modal visible={branchPickerOpen} transparent animationType="slide" onRequestClose={() => setBranchPickerOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Choose your branch</Text>
            {BRANCHES.map(branch => (
              <Pressable
                key={branch}
                style={styles.branchOption}
                onPress={() => {
                  update("branch", branch);
                  setBranchPickerOpen(false);
                }}>
                <Text style={styles.branchText}>{branch}</Text>
              </Pressable>
            ))}
            <Pressable style={styles.closeButton} onPress={() => setBranchPickerOpen(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.paper },
  content: { padding: 18, paddingBottom: 40 },
  card: { backgroundColor: colors.card, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: colors.line },
  eyebrow: { color: colors.green, fontWeight: "700", fontSize: 12, textTransform: "uppercase", marginBottom: 8 },
  title: { fontSize: 25, fontWeight: "800", color: colors.ink, marginBottom: 6 },
  hint: { color: colors.muted, marginBottom: 18, lineHeight: 20 },
  hintSmall: { color: colors.muted, fontSize: 12, marginTop: -4, marginBottom: 8 },
  label: { color: colors.ink, fontWeight: "600", fontSize: 13, marginBottom: 6 },
  row: { flexDirection: "row", gap: 10 },
  half: { flex: 1 },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  inputText: { color: colors.ink },
  photoRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  photoButton: { backgroundColor: colors.blueBg, borderColor: colors.blue, borderWidth: 1, paddingVertical: 9, paddingHorizontal: 12, borderRadius: 9 },
  photoButtonText: { color: colors.blue, fontWeight: "700" },
  photoStatus: { color: colors.muted, fontSize: 12, flex: 1 },
  preview: { height: 150, backgroundColor: colors.paper, borderRadius: 10, marginBottom: 14 },
  button: { backgroundColor: colors.green, borderRadius: 12, padding: 14, marginTop: 4, minHeight: 48, justifyContent: "center" },
  buttonText: { color: "white", textAlign: "center", fontWeight: "700", fontSize: 15 },
  disabled: { opacity: 0.6 },
  error: { color: colors.danger, marginBottom: 10 },
  loginLink: { alignItems: "center", paddingVertical: 14 },
  loginText: { color: colors.muted },
  loginBold: { color: colors.green, fontWeight: "700" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: colors.card, padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  modalTitle: { fontSize: 18, fontWeight: "800", color: colors.ink, marginBottom: 10 },
  branchOption: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line },
  branchText: { color: colors.ink },
  closeButton: { backgroundColor: colors.green, borderRadius: 10, padding: 12, marginTop: 14 },
  closeButtonText: { color: "#fff", fontWeight: "700", textAlign: "center" },
});
