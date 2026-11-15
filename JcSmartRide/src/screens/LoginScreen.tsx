import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import {
  checkVerificationStatus,
  uploadStudentId,
  VerificationStudent,
} from "../api/client";
import { RootStack } from "../navigation/types";
import { colors } from "../theme";
import { pickStudentIdPhoto } from "../utils/photo";

type Props = NativeStackScreenProps<RootStack, "Login">;

export default function LoginScreen({ navigation, route }: Props) {
  const { login } = useAuth();

  // --- tab ---
  const [activeTab, setActiveTab] = useState<"login" | "check">(
    route.params?.checkStatus ? "check" : "login",
  );

  // --- login tab ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // --- check tab ---
  const [identifier, setIdentifier] = useState("");
  const [checkLoading, setCheckLoading] = useState(false);
  const [checkError, setCheckError] = useState("");
  const [verifyResult, setVerifyResult] = useState<VerificationStudent | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");

  useEffect(() => {
    if (route.params?.checkStatus) setActiveTab("check");
  }, [route.params?.checkStatus]);

  async function submitLogin() {
    if (!email.trim() || !password) {
      setLoginError("Please fill in all fields.");
      return;
    }
    setLoginError("");
    setLoginLoading(true);
    try {
      const user = await login(email.trim(), password);
      if (user.role === "admin") {
        navigation.replace("Admin");
      } else if (route.params?.search) {
        navigation.replace("Match", { search: route.params.search });
      } else {
        navigation.replace(route.params?.next ?? "Home");
      }
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoginLoading(false);
    }
  }

  async function submitCheck() {
    if (!identifier.trim()) {
      setCheckError("Please enter your Student ID or email.");
      return;
    }
    setCheckError("");
    setVerifyResult(null);
    setCheckLoading(true);
    try {
      const res = await checkVerificationStatus(identifier.trim());
      setVerifyResult(res.student);
    } catch (err) {
      setCheckError(err instanceof Error ? err.message : "Could not check status");
    } finally {
      setCheckLoading(false);
    }
  }

  async function uploadPhoto() {
    if (!verifyResult) return;
    setCheckError("");
    setUploadMessage("");
    try {
      const photo = await pickStudentIdPhoto();
      if (!photo) return;
      setUploadingPhoto(true);
      await uploadStudentId(verifyResult.email, photo);
      const refreshed = await checkVerificationStatus(verifyResult.email);
      setVerifyResult(refreshed.student);
      setUploadMessage("Student ID photo uploaded. Your account is pending admin review.");
    } catch (err) {
      setCheckError(err instanceof Error ? err.message : "Could not upload the ID photo");
    } finally {
      setUploadingPhoto(false);
    }
  }

  function statusColor(status: string | null) {
    if (status === "verified") return colors.okGreen ?? "#15803d";
    if (status === "rejected") return colors.danger;
    return colors.amber ?? "#9a5b10";
  }

  function statusMessage(status: string | null) {
    if (status === "verified")
      return "✅ Your identity has been verified! You can now log in and use the ride-sharing service.";
    if (status === "rejected")
      return "❌ Your verification was rejected. Please contact the admin or re-upload your student ID via the web portal.";
    return "⏳ Your verification is pending. An admin will review your student ID shortly. Check back soon!";
  }

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.headerBox}>
        <Text style={styles.appName}>🚌 JC SmartRide</Text>
        <Text style={styles.appSub}>J.C. Bose University, YMCA Faridabad</Text>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        <Pressable
          style={[styles.tab, activeTab === "login" && styles.tabActive]}
          onPress={() => setActiveTab("login")}
        >
          <Text style={[styles.tabText, activeTab === "login" && styles.tabTextActive]}>
            Login
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === "check" && styles.tabActive]}
          onPress={() => setActiveTab("check")}
        >
          <Text style={[styles.tabText, activeTab === "check" && styles.tabTextActive]}>
            Check ID Status
          </Text>
        </Pressable>
      </View>

      {/* ===== LOGIN TAB ===== */}
      {activeTab === "login" && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome back</Text>
          <Text style={styles.cardSub}>Sign in to your campus ride account</Text>

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="student@jcboseuniversity.ac.in"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            placeholderTextColor={colors.muted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {loginError ? <Text style={styles.error}>{loginError}</Text> : null}

          <Pressable
            style={[styles.btn, loginLoading && styles.btnDisabled]}
            onPress={submitLogin}
            disabled={loginLoading}
          >
            {loginLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Login →</Text>
            )}
          </Pressable>

          <Pressable style={styles.linkRow} onPress={() => navigation.navigate("Register")}>
            <Text style={styles.linkText}>Don't have an account? </Text>
            <Text style={[styles.linkText, styles.linkBold]}>Register here</Text>
          </Pressable>
        </View>
      )}

      {/* ===== CHECK ID STATUS TAB ===== */}
      {activeTab === "check" && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Check ID Verification</Text>
          <Text style={styles.cardSub}>
            Enter your Student ID or college email to see your verification status.
          </Text>

          <Text style={styles.label}>Student ID or Email</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 21CS001 or you@jcbose.ac.in"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            value={identifier}
            onChangeText={text => {
              setIdentifier(text);
              setVerifyResult(null);
              setCheckError("");
            }}
          />

          {checkError ? <Text style={styles.error}>{checkError}</Text> : null}

          <Pressable
            style={[styles.btn, checkLoading && styles.btnDisabled]}
            onPress={submitCheck}
            disabled={checkLoading}
          >
            {checkLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>🔍 Check Status</Text>
            )}
          </Pressable>

          {verifyResult && (
            <View
              style={[
                styles.resultCard,
                { borderLeftColor: statusColor(verifyResult.verification_status) },
              ]}
            >
              <Text style={styles.resultName}>{verifyResult.name}</Text>
              <Text style={styles.resultMeta}>ID: {verifyResult.student_id} · {verifyResult.branch}</Text>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: statusColor(verifyResult.verification_status) + "22" },
                ]}
              >
                <Text
                  style={[styles.badgeText, { color: statusColor(verifyResult.verification_status) }]}
                >
                  {verifyResult.verification_status.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.resultMsg}>{statusMessage(verifyResult.verification_status)}</Text>
              {verifyResult.verification_status === "verified" ? (
                <Pressable
                  style={styles.inlineButton}
                  onPress={() => {
                    setActiveTab("login");
                    setEmail(verifyResult.email);
                  }}>
                  <Text style={styles.inlineButtonText}>Continue to login</Text>
                </Pressable>
              ) : (
                <>
                  <Pressable
                    style={[styles.inlineButton, uploadingPhoto && styles.btnDisabled]}
                    onPress={uploadPhoto}
                    disabled={uploadingPhoto}>
                    {uploadingPhoto
                      ? <ActivityIndicator color="#fff" />
                      : <Text style={styles.inlineButtonText}>{verifyResult.has_id_card ? "Replace student ID photo" : "Upload student ID photo"}</Text>}
                  </Pressable>
                  <Text style={styles.photoHint}>
                    {verifyResult.has_id_card ? "A photo is already attached. You can replace it with a clearer image." : "A clear student ID image helps the admin verify your account."}
                  </Text>
                  {verifyResult.id_card_photo ? (
                    <Image source={{ uri: verifyResult.id_card_photo }} style={styles.photoPreview} resizeMode="contain" />
                  ) : null}
                </>
              )}
              {uploadMessage ? <Text style={styles.uploadMessage}>{uploadMessage}</Text> : null}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.paper },
  content: { padding: 20, paddingBottom: 40 },

  headerBox: {
    alignItems: "center",
    marginBottom: 24,
    paddingTop: 12,
  },
  appName: { fontSize: 26, fontWeight: "800", color: colors.green },
  appSub: { fontSize: 12, color: colors.muted, marginTop: 4 },

  tabBar: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: 10,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.line,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  tabActive: { backgroundColor: colors.green },
  tabText: { fontWeight: "600", color: colors.muted, fontSize: 13 },
  tabTextActive: { color: "#fff" },

  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cardTitle: { fontSize: 20, fontWeight: "800", color: colors.ink, marginBottom: 4 },
  cardSub: { color: colors.muted, fontSize: 13, marginBottom: 18 },

  label: { fontSize: 13, fontWeight: "600", color: colors.ink, marginBottom: 6 },
  input: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: colors.ink,
    marginBottom: 14,
  },

  error: { color: colors.danger, fontSize: 13, marginBottom: 10, fontWeight: "500" },

  btn: {
    backgroundColor: colors.green,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 14,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  linkRow: { flexDirection: "row", justifyContent: "center", marginTop: 4 },
  linkText: { color: colors.muted, fontSize: 13 },
  linkBold: { color: colors.green, fontWeight: "700" },

  resultCard: {
    backgroundColor: "#f0fdf4",
    borderLeftWidth: 4,
    borderRadius: 10,
    padding: 14,
    marginTop: 14,
  },
  resultName: { fontSize: 16, fontWeight: "700", color: colors.ink, marginBottom: 8 },
  resultMeta: { color: colors.muted, fontSize: 12, marginBottom: 8 },
  badge: { alignSelf: "flex-start", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 10 },
  badgeText: { fontSize: 12, fontWeight: "700" },
  resultMsg: { fontSize: 13, color: colors.ink, lineHeight: 20 },
  inlineButton: { backgroundColor: colors.green, borderRadius: 9, padding: 11, alignItems: "center", marginTop: 12 },
  inlineButtonText: { color: "#fff", fontWeight: "700" },
  photoHint: { fontSize: 12, color: colors.muted, marginTop: 8, lineHeight: 17 },
  photoPreview: { height: 150, marginTop: 10, borderRadius: 8, backgroundColor: colors.card },
  uploadMessage: { color: colors.okGreen, fontSize: 12, marginTop: 8 },
});
