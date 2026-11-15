import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  adminBookings,
  adminCancelRide,
  adminRides,
  adminStudents,
  adminUploadPhoto,
  deleteStudent,
  rejectStudent,
  Ride,
  verifyStudent,
} from "../api/client";
import { useAuth } from "../context/AuthContext";
import { RootStack } from "../navigation/types";
import { colors } from "../theme";
import { pickStudentIdPhoto } from "../utils/photo";

type Props = NativeStackScreenProps<RootStack, "Admin">;
type Student = {
  id: number;
  name: string;
  email: string;
  phone: string;
  student_id: string;
  branch?: string;
  verification_status: string;
  id_card_photo?: string | null;
};
type AdminBooking = {
  id: number;
  status: string;
  passenger_name: string;
  driver_name: string;
  ride_date: string;
  ride_time: string;
  pickup: string;
  drop: string;
};
type Tab = "students" | "rides" | "bookings";

const TABS: Array<{ key: Tab; label: string }> = [
  { key: "students", label: "Students" },
  { key: "rides", label: "Rides" },
  { key: "bookings", label: "Bookings" },
];
const FILTERS = ["all", "pending", "verified", "rejected"];

function badgeColor(status: string) {
  if (status === "verified" || status === "open" || status === "accepted") {
    return { bg: colors.okBg, fg: colors.okGreen };
  }
  if (status === "rejected" || status === "cancelled") {
    return { bg: colors.dangerBg, fg: colors.danger };
  }
  if (status === "completed") return { bg: colors.blueBg, fg: colors.blue };
  return { bg: colors.amberBg, fg: colors.amber };
}

function StatusBadge({ status }: { status: string }) {
  const c = badgeColor(status);
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeText, { color: c.fg }]}>{status.toUpperCase()}</Text>
    </View>
  );
}

export default function AdminScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [rides, setRides] = useState<Ride[]>([]);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [tab, setTab] = useState<Tab>("students");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [photo, setPhoto] = useState<{ student: Student; data: string } | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busyKey, setBusyKey] = useState("");

  const load = useCallback(async () => {
    if (!user || user.role !== "admin") {
      navigation.replace("Home");
      return;
    }
    try {
      const [studentData, rideData, bookingData] = await Promise.all([
        adminStudents(),
        adminRides(),
        adminBookings(),
      ]);
      setStudents(studentData.students ?? []);
      setRides(rideData.rides ?? []);
      setBookings(bookingData.bookings ?? []);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load admin data");
    }
  }, [navigation, user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filteredStudents = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return students.filter(student => {
      const matchesStatus = statusFilter === "all" || student.verification_status === statusFilter;
      const searchable = `${student.name} ${student.email} ${student.student_id} ${student.branch ?? ""}`.toLowerCase();
      return matchesStatus && (!needle || searchable.includes(needle));
    });
  }, [query, statusFilter, students]);

  async function run(key: string, operation: () => Promise<unknown>, message: string) {
    setError("");
    setSuccess("");
    setBusyKey(key);
    try {
      await operation();
      setSuccess(message);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "The action could not be completed");
    } finally {
      setBusyKey("");
    }
  }

  async function uploadPhoto(student: Student) {
    setError("");
    try {
      const data = await pickStudentIdPhoto();
      if (!data) return;
      await run(`photo-${student.id}`, () => adminUploadPhoto(student.id, data), `ID photo updated for ${student.name}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not select the photo");
    }
  }

  function confirmDelete(student: Student) {
    Alert.alert(
      "Delete student account?",
      `This permanently deletes ${student.name} and their rides, bookings, and ratings.`,
      [
        { text: "Keep account", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => run(`delete-${student.id}`, () => deleteStudent(student.id), `${student.name} was deleted.`),
        },
      ],
    );
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.eyebrow}>Management</Text>
      <Text style={styles.title}>Admin dashboard</Text>
      <Text style={styles.subtitle}>Review student verification and monitor campus rides and bookings.</Text>

      <View style={styles.statsRow}>
        <StatCard label="Students" value={students.length} icon="🎓" />
        <StatCard label="Pending" value={students.filter(s => s.verification_status === "pending").length} icon="⏳" />
        <StatCard label="Rides" value={rides.length} icon="🚗" />
        <StatCard label="Bookings" value={bookings.length} icon="🎫" />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {success ? <Text style={styles.success}>{success}</Text> : null}

      <View style={styles.tabRow}>
        {TABS.map(item => (
          <Pressable key={item.key} style={tab === item.key ? styles.tabOn : styles.tab} onPress={() => setTab(item.key)}>
            <Text style={tab === item.key ? styles.tabOnText : styles.tabText}>{item.label}</Text>
          </Pressable>
        ))}
      </View>

      {tab === "students" ? (
        <View>
          <TextInput
            style={styles.search}
            value={query}
            onChangeText={setQuery}
            placeholder="Search name, email, ID or branch"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {FILTERS.map(filter => (
              <Pressable key={filter} style={statusFilter === filter ? styles.filterOn : styles.filter} onPress={() => setStatusFilter(filter)}>
                <Text style={statusFilter === filter ? styles.filterOnText : styles.filterText}>{filter === "all" ? "All statuses" : filter}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <Text style={styles.countText}>Showing {filteredStudents.length} of {students.length} students</Text>
          {filteredStudents.length === 0 ? <EmptyState text="No students match these filters." /> : null}
          {filteredStudents.map(student => (
            <View key={student.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.studentIdentity}>
                  <Text style={styles.name}>{student.name}</Text>
                  <Text style={styles.meta}>{student.email}</Text>
                </View>
                <StatusBadge status={student.verification_status} />
              </View>
              <Text style={styles.meta}>ID: {student.student_id} · {student.branch || "Computer Engineering"}</Text>
              {student.phone ? <Text style={styles.meta}>Phone: {student.phone}</Text> : null}
              <View style={styles.actions}>
                {student.id_card_photo ? (
                  <Pressable
                    style={styles.secondaryButton}
                    onPress={() => setPhoto({ student, data: student.id_card_photo! })}>
                    <Text style={styles.secondaryButtonText}>View ID photo</Text>
                  </Pressable>
                ) : null}
                <Pressable style={styles.secondaryButton} onPress={() => uploadPhoto(student)}>
                  <Text style={styles.secondaryButtonText}>{student.id_card_photo ? "Replace ID photo" : "Upload ID photo"}</Text>
                </Pressable>
                {student.verification_status !== "verified" ? (
                  <Pressable style={styles.acceptButton} disabled={busyKey === `verify-${student.id}`} onPress={() => run(`verify-${student.id}`, () => verifyStudent(student.id), `${student.name} verified.`)}>
                    <Text style={styles.actionText}>Verify</Text>
                  </Pressable>
                ) : null}
                {student.verification_status !== "rejected" ? (
                  <Pressable style={styles.rejectButton} disabled={busyKey === `reject-${student.id}`} onPress={() => run(`reject-${student.id}`, () => rejectStudent(student.id), `${student.name} rejected.`)}>
                    <Text style={styles.rejectText}>Reject</Text>
                  </Pressable>
                ) : null}
                <Pressable style={styles.deleteButton} onPress={() => confirmDelete(student)}>
                  <Text style={styles.deleteText}>Delete</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {tab === "rides" ? (
        <View>
          {rides.length === 0 ? <EmptyState text="No rides to display." /> : null}
          {rides.map(ride => (
            <View key={ride.id} style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.name}>{ride.driver.name}</Text>
                <StatusBadge status={ride.status} />
              </View>
              <Text style={styles.route}>{ride.pickup.name} → {ride.drop.name}</Text>
              <Text style={styles.meta}>{ride.ride_date} at {ride.ride_time} · {ride.seats_available}/{ride.seats_total} seats · ₹{ride.cost_per_seat}/seat</Text>
              {ride.driver.phone ? <Text style={styles.meta}>Driver phone: {ride.driver.phone}</Text> : null}
              {ride.status !== "cancelled" && ride.status !== "completed" ? (
                <Pressable style={styles.deleteButton} disabled={busyKey === `ride-${ride.id}`} onPress={() => run(`ride-${ride.id}`, () => adminCancelRide(ride.id), "Ride cancelled by admin.")}>
                  <Text style={styles.deleteText}>Cancel ride</Text>
                </Pressable>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}

      {tab === "bookings" ? (
        <View>
          {bookings.length === 0 ? <EmptyState text="No bookings to display." /> : null}
          {bookings.map(booking => (
            <View key={booking.id} style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.name}>{booking.passenger_name}</Text>
                <StatusBadge status={booking.status} />
              </View>
              <Text style={styles.meta}>Driver: {booking.driver_name}</Text>
              <Text style={styles.route}>{booking.pickup} → {booking.drop}</Text>
              <Text style={styles.meta}>{booking.ride_date} at {booking.ride_time}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <Modal visible={photo != null} transparent animationType="fade" onRequestClose={() => setPhoto(null)}>
        <View style={styles.photoOverlay}>
          <View style={styles.photoModal}>
            <Text style={styles.modalTitle}>{photo?.student.name} · Student ID</Text>
            {photo ? <Image source={{ uri: photo.data }} style={styles.photoPreview} resizeMode="contain" /> : null}
            <Pressable style={styles.primaryButton} onPress={() => setPhoto(null)}>
              <Text style={styles.actionText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function EmptyState({ text }: { text: string }) {
  return <View style={styles.empty}><Text style={styles.emptyText}>{text}</Text></View>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.paper },
  content: { padding: 16, paddingBottom: 36 },
  eyebrow: { color: colors.green, textTransform: "uppercase", fontSize: 12, fontWeight: "700" },
  title: { fontSize: 27, fontWeight: "800", color: colors.ink, marginTop: 3 },
  subtitle: { color: colors.muted, marginTop: 4, marginBottom: 14, lineHeight: 19 },
  statsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  statCard: { flexGrow: 1, flexBasis: "22%", minWidth: 75, backgroundColor: colors.card, borderRadius: 12, padding: 10, alignItems: "center", borderWidth: 1, borderColor: colors.line },
  statIcon: { fontSize: 18 },
  statValue: { fontSize: 19, fontWeight: "800", color: colors.ink },
  statLabel: { fontSize: 11, color: colors.muted },
  tabRow: { flexDirection: "row", gap: 7, marginBottom: 12 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, alignItems: "center" },
  tabOn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: colors.green, alignItems: "center" },
  tabText: { color: colors.muted, fontWeight: "600", fontSize: 12 },
  tabOnText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  search: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: 10, padding: 12, color: colors.ink, marginBottom: 8 },
  filterRow: { gap: 7, paddingBottom: 8 },
  filter: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 7 },
  filterOn: { backgroundColor: colors.blue, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 7 },
  filterText: { color: colors.muted, fontSize: 12, textTransform: "capitalize" },
  filterOnText: { color: "#fff", fontSize: 12, fontWeight: "700", textTransform: "capitalize" },
  countText: { color: colors.muted, fontSize: 12, marginBottom: 8 },
  card: { backgroundColor: colors.card, borderRadius: 13, borderWidth: 1, borderColor: colors.line, padding: 13, marginBottom: 10 },
  cardTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 6 },
  studentIdentity: { flex: 1 },
  name: { color: colors.ink, fontWeight: "800", fontSize: 15 },
  meta: { color: colors.muted, fontSize: 12, marginBottom: 3 },
  route: { color: colors.ink, fontWeight: "700", marginBottom: 4 },
  badge: { borderRadius: 14, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { fontSize: 10, fontWeight: "800" },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 9 },
  primaryButton: { backgroundColor: colors.green, borderRadius: 9, paddingHorizontal: 12, paddingVertical: 9, alignItems: "center", marginTop: 10 },
  secondaryButton: { backgroundColor: colors.blueBg, borderWidth: 1, borderColor: colors.blue, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  secondaryButtonText: { color: colors.blue, fontWeight: "700", fontSize: 12 },
  acceptButton: { backgroundColor: colors.okGreen, borderRadius: 8, paddingHorizontal: 11, paddingVertical: 8 },
  actionText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  rejectButton: { backgroundColor: colors.amberBg, borderWidth: 1, borderColor: colors.amber, borderRadius: 8, paddingHorizontal: 11, paddingVertical: 8 },
  rejectText: { color: colors.amber, fontWeight: "700", fontSize: 12 },
  deleteButton: { backgroundColor: colors.dangerBg, borderWidth: 1, borderColor: colors.danger, borderRadius: 8, paddingHorizontal: 11, paddingVertical: 8, marginTop: 8 },
  deleteText: { color: colors.danger, fontWeight: "700", fontSize: 12 },
  error: { color: colors.danger, backgroundColor: colors.dangerBg, padding: 10, borderRadius: 8, marginBottom: 9 },
  success: { color: colors.okGreen, backgroundColor: colors.okBg, padding: 10, borderRadius: 8, marginBottom: 9 },
  empty: { backgroundColor: colors.card, padding: 20, borderRadius: 12, alignItems: "center" },
  emptyText: { color: colors.muted },
  photoOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "center", padding: 18 },
  photoModal: { backgroundColor: colors.card, padding: 14, borderRadius: 14 },
  modalTitle: { color: colors.ink, fontWeight: "800", fontSize: 16, marginBottom: 8 },
  photoPreview: { width: "100%", height: 360, backgroundColor: colors.paper, borderRadius: 8 },
});
