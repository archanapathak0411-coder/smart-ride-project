import React, { useCallback, useState } from "react";
import {
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
  acceptBooking,
  cancelBooking,
  cancelRide,
  completeRide,
  createRating,
  getSavings,
  myBookings,
  myRides,
  rejectBooking,
  Ride,
  updateRide,
} from "../api/client";
import RideCard from "../components/RideCard";
import MapPreview from "../components/MapPreview";
import { useAuth } from "../context/AuthContext";
import { RootStack } from "../navigation/types";
import { colors } from "../theme";
import { callPhoneNumber } from "../utils/phone";

type Booking = {
  id: number;
  status: string;
  can_rate: boolean;
  my_rating: number | null;
  ride: Ride;
};

type SavingsData = {
  saved: number | null;
  trip_count: number;
  trips: Array<{
    booking_id: number;
    ride_date: string;
    pickup: string;
    drop: string;
    cost_per_seat: number;
    saved: number | null;
  }>;
};

type EditFields = {
  seats_total: string;
  cost_per_seat: string;
  ride_time: string;
};

type RatingState = {
  stars: number;
  comment: string;
};

type Props = NativeStackScreenProps<RootStack, "MyRides">;

const TAB_LABELS: Record<string, string> = {
  upcoming: "🚗 Upcoming Rides",
  completed: "✅ Completed Trips",
  cancelled: "❌ Cancelled",
};

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  pending: { bg: colors.amberBg, fg: colors.amber },
  accepted: { bg: colors.okBg, fg: colors.okGreen },
  rejected: { bg: colors.dangerBg, fg: colors.danger },
  cancelled: { bg: colors.dangerBg, fg: colors.danger },
  completed: { bg: colors.blueBg, fg: colors.blue },
  open: { bg: colors.okBg, fg: colors.okGreen },
  full: { bg: colors.amberBg, fg: colors.amber },
};

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_COLORS[status] ?? { bg: "#e5e7eb", fg: "#374151" };
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeText, { color: c.fg }]}>
        {status.toUpperCase()}
      </Text>
    </View>
  );
}

export default function MyRidesScreen({ navigation }: Props) {
  const { user, saveProfile } = useAuth();
  const [tab, setTab] = useState("upcoming");
  const [offered, setOffered] = useState<Ride[]>([]);
  const [joined, setJoined] = useState<Booking[]>([]);
  const [savings, setSavings] = useState<SavingsData>({ saved: null, trip_count: 0, trips: [] });
  const [fare, setFare] = useState(
    user?.typical_solo_fare != null ? String(user.typical_solo_fare) : ""
  );
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [trackingRideId, setTrackingRideId] = useState<number | null>(null);

  // Edit modal state
  const [editRide, setEditRide] = useState<Ride | null>(null);
  const [editFields, setEditFields] = useState<EditFields>({
    seats_total: "",
    cost_per_seat: "",
    ride_time: "",
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  // Rating state per booking
  const [ratingState, setRatingState] = useState<Record<number, RatingState>>({});
  const [ratingSubmitting, setRatingSubmitting] = useState<Record<number, boolean>>({});

  const load = useCallback(async () => {
    if (!user) {
      navigation.replace("Login");
      return;
    }
    try {
      const [ridesData, bookingsData, savingsData] = await Promise.all([
        myRides(),
        myBookings(),
        getSavings(),
      ]);
      setOffered(ridesData.rides ?? []);
      setJoined(bookingsData.bookings ?? []);
      setSavings({
        saved: savingsData.saved ?? null,
        trip_count: savingsData.trip_count ?? 0,
        trips: savingsData.trips ?? [],
      });
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load rides");
    }
  }, [navigation, user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleSaveFare() {
    try {
      await saveProfile({ typical_solo_fare: fare === "" ? null : Number(fare) });
      setSuccess("Typical solo fare saved.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save fare");
    }
  }

  async function handleCancelRide(rideId: number) {
    try {
      await cancelRide(rideId);
      setSuccess("Ride cancelled.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel ride");
    }
  }

  async function handleCompleteRide(rideId: number) {
    try {
      await completeRide(rideId);
      setSuccess("Ride marked completed.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete ride");
    }
  }

  async function handleAccept(bookingId: number) {
    try {
      await acceptBooking(bookingId);
      setSuccess("Booking accepted.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept");
    }
  }

  async function handleReject(bookingId: number) {
    try {
      await rejectBooking(bookingId);
      setSuccess("Booking rejected.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject");
    }
  }

  async function handleCancelBooking(bookingId: number) {
    try {
      await cancelBooking(bookingId);
      setSuccess("Booking cancelled.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel booking");
    }
  }

  function openEdit(ride: Ride) {
    setEditRide(ride);
    setEditFields({
      seats_total: String(ride.seats_total),
      cost_per_seat: String(ride.cost_per_seat),
      ride_time: ride.ride_time,
    });
    setEditError("");
  }

  async function handleSaveEdit() {
    if (!editRide) return;
    setEditLoading(true);
    setEditError("");
    try {
      await updateRide(editRide.id, {
        seats_total: Number(editFields.seats_total),
        cost_per_seat: Number(editFields.cost_per_seat),
        ride_time: editFields.ride_time,
      });
      setEditRide(null);
      setSuccess("Ride details updated.");
      await load();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setEditLoading(false);
    }
  }

  async function handleSubmitRating(booking: Booking) {
    const rs = ratingState[booking.id];
    if (!rs || rs.stars === 0) return;
    setRatingSubmitting(prev => ({ ...prev, [booking.id]: true }));
    try {
      await createRating({
        booking_id: booking.id,
        stars: rs.stars,
        comment: rs.comment,
      });
      setSuccess("Rating submitted. Thank you!");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit rating");
    } finally {
      setRatingSubmitting(prev => ({ ...prev, [booking.id]: false }));
    }
  }

  const offeredVisible = offered.filter(
    ride => groupStatus(ride.status) === tab
  );
  const joinedVisible = joined.filter(
    booking => groupBooking(booking) === tab
  );

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      {/* Header */}
      <Text style={styles.title}>🗂 My Rides & Passenger Dashboard</Text>
      <Text style={styles.subtitle}>Manage your offered rides and joined trips</Text>

      {/* Savings Card */}
      <View style={styles.savingsCard}>
        {savings.saved != null ? (
          <>
            <Text style={styles.savingsText}>
              💸 Money Saved: ₹{Math.round(savings.saved)} across {savings.trip_count} shared trip{savings.trip_count !== 1 ? "s" : ""}!
            </Text>
            {savings.trips.length > 0 && (
              <View style={styles.recentTrips}>
                <Text style={styles.recentHeading}>Recent trips:</Text>
                {savings.trips.slice(-5).reverse().map(trip => (
                  <Text key={trip.booking_id} style={styles.recentItem}>
                    • {trip.ride_date}: {trip.pickup} → {trip.drop} · paid ₹{Math.round(trip.cost_per_seat)}
                    {trip.saved != null ? ` · saved ₹${Math.round(trip.saved)}` : ""}
                  </Text>
                ))}
              </View>
            )}
          </>
        ) : (
          <Text style={styles.savingsPrompt}>
            💡 Set your solo fare to track how much you save with carpooling!
          </Text>
        )}
        <View style={styles.fareRow}>
          <TextInput
            style={styles.fareInput}
            value={fare}
            keyboardType="number-pad"
            onChangeText={setFare}
            placeholder="Solo fare (₹)"
            placeholderTextColor={colors.muted}
          />
          <Pressable style={styles.saveBtn} onPress={handleSaveFare}>
            <Text style={styles.saveBtnText}>Save</Text>
          </Pressable>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {Object.entries(TAB_LABELS).map(([key, label]) => (
          <Pressable
            key={key}
            style={tab === key ? styles.tabOn : styles.tab}
            onPress={() => setTab(key)}
          >
            <Text style={tab === key ? styles.tabOnText : styles.tabText}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {success ? <Text style={styles.success}>{success}</Text> : null}

      {/* Driver Section */}
      <Text style={styles.heading}>🚗 Rides I Offered</Text>
      {offeredVisible.length === 0 && (
        <Text style={styles.empty}>No rides in this category.</Text>
      )}
      {offeredVisible.map(ride => (
        <View key={ride.id}>
        <RideCard ride={ride}>
          {/* Action buttons */}
          {(ride.status === "open" || ride.status === "full") && (
            <View style={styles.actionRow}>
              <Pressable style={styles.editBtn} onPress={() => openEdit(ride)}>
                <Text style={styles.editBtnText}>✏️ Edit Ride Details</Text>
              </Pressable>
              <Pressable
                style={styles.completeBtn}
                onPress={() => handleCompleteRide(ride.id)}
              >
                <Text style={styles.completeBtnText}>✅ Mark Completed</Text>
              </Pressable>
              <Pressable
                style={styles.cancelBtn}
                onPress={() => handleCancelRide(ride.id)}
              >
                <Text style={styles.cancelBtnText}>Cancel Ride</Text>
              </Pressable>
            </View>
          )}

          {/* Passenger list */}
          {ride.bookings && (
            <View style={styles.passengerSection}>
              <Text style={styles.passengerHeading}>Passengers & bookings ({ride.bookings.length})</Text>
              {ride.bookings.length === 0 ? <Text style={styles.passengerMeta}>No passenger requests yet.</Text> : null}
              {ride.bookings.map(booking => (
                <View key={booking.id} style={styles.passengerCard}>
                  <View style={styles.passengerInfo}>
                    <Text style={styles.passengerName}>
                      {booking.passenger.name}
                    </Text>
                    {booking.passenger.student_id ? (
                      <Text style={styles.passengerMeta}>
                        ID: {booking.passenger.student_id}{booking.passenger.branch ? ` · ${booking.passenger.branch}` : ""}
                      </Text>
                    ) : null}
                    {booking.passenger.phone ? (
                      <Pressable onPress={() => callPhoneNumber(booking.passenger.phone!)}>
                        <Text style={[styles.passengerMeta, styles.phoneLink]}>📞 {booking.passenger.phone}</Text>
                      </Pressable>
                    ) : null}
                    <StatusBadge status={booking.status} />
                  </View>
                  {booking.status === "pending" && (
                    <View style={styles.bookingActions}>
                      <Pressable
                        style={styles.acceptBtn}
                        onPress={() => handleAccept(booking.id)}
                      >
                        <Text style={styles.acceptBtnText}>Accept</Text>
                      </Pressable>
                      <Pressable
                        style={styles.rejectBtn}
                        onPress={() => handleReject(booking.id)}
                      >
                        <Text style={styles.rejectBtnText}>Reject</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </RideCard>
        <Pressable
          style={styles.mapToggle}
          onPress={() => setTrackingRideId(trackingRideId === ride.id ? null : ride.id)}>
          <Text style={styles.mapToggleText}>{trackingRideId === ride.id ? "Hide route preview" : "Preview route"}</Text>
        </Pressable>
        {trackingRideId === ride.id ? <MapPreview pickup={ride.pickup} drop={ride.drop} tracking /> : null}
        </View>
      ))}

      {/* Passenger Section */}
      <Text style={styles.heading}>🎫 Rides I Joined</Text>
      {joinedVisible.length === 0 && (
        <Text style={styles.empty}>No rides in this category.</Text>
      )}
      {joinedVisible.map(booking => (
        <View key={booking.id}>
        <RideCard ride={booking.ride}>
          <View style={styles.joinedStatusRow}>
            <Text style={styles.joinedStatusLabel}>Booking status: </Text>
            <StatusBadge status={booking.status} />
          </View>

          {(booking.status === "pending" || booking.status === "accepted") &&
            booking.ride.status !== "completed" &&
            booking.ride.status !== "cancelled" && (
            <Pressable
              style={styles.cancelBtn}
              onPress={() => handleCancelBooking(booking.id)}
            >
              <Text style={styles.cancelBtnText}>Cancel Booking</Text>
            </Pressable>
          )}
          <Pressable
            style={styles.mapToggle}
            onPress={() => setTrackingRideId(trackingRideId === booking.ride.id ? null : booking.ride.id)}>
            <Text style={styles.mapToggleText}>{trackingRideId === booking.ride.id ? "Hide route preview" : "Preview route"}</Text>
          </Pressable>

          {/* Rating */}
          {booking.can_rate && booking.my_rating == null && (
            <View style={styles.ratingSection}>
              <Text style={styles.ratingHeading}>Rate this ride</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map(star => (
                  <Pressable
                    key={star}
                    onPress={() =>
                      setRatingState(prev => ({
                        ...prev,
                        [booking.id]: {
                          stars: star,
                          comment: prev[booking.id]?.comment ?? "",
                        },
                      }))
                    }
                  >
                    <Text style={styles.star}>
                      {(ratingState[booking.id]?.stars ?? 0) >= star
                        ? "⭐"
                        : "☆"}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <TextInput
                style={styles.commentInput}
                value={ratingState[booking.id]?.comment ?? ""}
                onChangeText={text =>
                  setRatingState(prev => ({
                    ...prev,
                    [booking.id]: {
                      stars: prev[booking.id]?.stars ?? 0,
                      comment: text,
                    },
                  }))
                }
                placeholder="Leave a comment (optional)"
                placeholderTextColor={colors.muted}
                multiline
              />
              <Pressable
                style={[
                  styles.submitRatingBtn,
                  !(ratingState[booking.id]?.stars) && styles.disabledBtn,
                ]}
                onPress={() => handleSubmitRating(booking)}
                disabled={
                  !ratingState[booking.id]?.stars ||
                  ratingSubmitting[booking.id]
                }
              >
                <Text style={styles.submitRatingText}>
                  {ratingSubmitting[booking.id] ? "Submitting..." : "Submit Rating"}
                </Text>
              </Pressable>
            </View>
          )}

          {booking.my_rating != null && (
            <Text style={styles.alreadyRated}>
              ⭐ You rated {booking.my_rating} star{booking.my_rating !== 1 ? "s" : ""}
            </Text>
          )}
        </RideCard>
        {trackingRideId === booking.ride.id ? <MapPreview pickup={booking.ride.pickup} drop={booking.ride.drop} tracking /> : null}
        </View>
      ))}

      {/* Edit Ride Modal */}
      <Modal
        visible={editRide != null}
        animationType="slide"
        transparent
        onRequestClose={() => setEditRide(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>✏️ Edit Ride Details</Text>
            {editError ? (
              <Text style={styles.error}>{editError}</Text>
            ) : null}

            <Text style={styles.fieldLabel}>Total Seats</Text>
            <TextInput
              style={styles.fieldInput}
              value={editFields.seats_total}
              keyboardType="number-pad"
              onChangeText={v =>
                setEditFields(prev => ({ ...prev, seats_total: v }))
              }
            />

            <Text style={styles.fieldLabel}>Fuel Cost / Seat (₹)</Text>
            <TextInput
              style={styles.fieldInput}
              value={editFields.cost_per_seat}
              keyboardType="number-pad"
              onChangeText={v =>
                setEditFields(prev => ({ ...prev, cost_per_seat: v }))
              }
            />

            <Text style={styles.fieldLabel}>Departure Time (HH:MM)</Text>
            <TextInput
              style={styles.fieldInput}
              value={editFields.ride_time}
              onChangeText={v =>
                setEditFields(prev => ({ ...prev, ride_time: v }))
              }
              placeholder="e.g. 08:30"
              placeholderTextColor={colors.muted}
            />

            <View style={styles.modalActions}>
              <Pressable
                style={styles.saveEditBtn}
                onPress={handleSaveEdit}
                disabled={editLoading}
              >
                <Text style={styles.saveEditBtnText}>
                  {editLoading ? "Saving..." : "Save Changes"}
                </Text>
              </Pressable>
              <Pressable
                style={styles.cancelModalBtn}
                onPress={() => setEditRide(null)}
              >
                <Text style={styles.cancelModalBtnText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function groupStatus(status: string) {
  if (status === "cancelled") return "cancelled";
  if (status === "completed") return "completed";
  return "upcoming";
}

function groupBooking(booking: Booking) {
  if (booking.status === "cancelled" || booking.status === "rejected")
    return "cancelled";
  if (
    booking.status === "completed" ||
    booking.ride.status === "completed"
  )
    return "completed";
  return "upcoming";
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.paper },
  content: { padding: 16, paddingBottom: 40 },

  title: { fontSize: 24, fontWeight: "800", color: colors.ink },
  subtitle: { fontSize: 14, color: colors.muted, marginTop: 2, marginBottom: 12 },

  // Savings card
  savingsCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.line,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  savingsText: { fontSize: 16, fontWeight: "700", color: colors.okGreen, marginBottom: 6 },
  savingsPrompt: { fontSize: 14, color: colors.muted, marginBottom: 8 },
  recentTrips: { marginTop: 6, marginBottom: 8 },
  recentHeading: { fontWeight: "600", color: colors.ink, marginBottom: 4 },
  recentItem: { color: colors.muted, fontSize: 13, marginLeft: 4 },
  fareRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  fareInput: {
    flex: 1,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    color: colors.ink,
  },
  saveBtn: {
    backgroundColor: colors.green,
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  saveBtnText: { color: "white", fontWeight: "700" },

  // Tabs
  tabRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  tab: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: colors.card,
  },
  tabOn: {
    backgroundColor: colors.green,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  tabText: { color: colors.ink, fontSize: 13 },
  tabOnText: { color: "white", fontSize: 13, fontWeight: "700" },

  error: { color: colors.danger, marginBottom: 8 },
  success: { color: colors.okGreen, backgroundColor: colors.okBg, padding: 10, borderRadius: 8, marginBottom: 8 },
  mapToggle: { backgroundColor: colors.card, borderRadius: 9, borderWidth: 1, borderColor: colors.green, padding: 10, marginTop: -4, marginBottom: 10 },
  mapToggleText: { color: colors.green, textAlign: "center", fontWeight: "700" },
  empty: { color: colors.muted, fontStyle: "italic", marginBottom: 12 },
  heading: { fontSize: 18, fontWeight: "700", color: colors.ink, marginTop: 12, marginBottom: 8 },

  // Action buttons row (driver)
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  editBtn: {
    backgroundColor: colors.blueBg,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.blue,
  },
  editBtnText: { color: colors.blue, fontWeight: "600", fontSize: 13 },
  completeBtn: {
    backgroundColor: colors.okBg,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.okGreen,
  },
  completeBtnText: { color: colors.okGreen, fontWeight: "600", fontSize: 13 },
  cancelBtn: {
    backgroundColor: colors.dangerBg,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.danger,
    marginTop: 6,
  },
  cancelBtnText: { color: colors.danger, fontWeight: "600", fontSize: 13 },

  // Passenger section
  passengerSection: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 10,
  },
  passengerHeading: { fontWeight: "700", color: colors.ink, marginBottom: 6 },
  passengerCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    backgroundColor: colors.paper,
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.line,
  },
  passengerInfo: { flex: 1 },
  passengerName: { fontWeight: "600", color: colors.ink, marginBottom: 2 },
  passengerMeta: { fontSize: 12, color: colors.muted, marginBottom: 2 },
  phoneLink: { color: colors.blue, textDecorationLine: "underline" },
  bookingActions: { flexDirection: "row", gap: 6, marginTop: 2 },
  acceptBtn: {
    backgroundColor: colors.okBg,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.okGreen,
  },
  acceptBtnText: { color: colors.okGreen, fontSize: 12, fontWeight: "600" },
  rejectBtn: {
    backgroundColor: colors.amberBg,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.amber,
  },
  rejectBtnText: { color: colors.amber, fontSize: 12, fontWeight: "600" },

  // Badge
  badge: {
    alignSelf: "flex-start",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
  },
  badgeText: { fontSize: 10, fontWeight: "700" },

  // Joined status
  joinedStatusRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  joinedStatusLabel: { color: colors.muted, fontSize: 13 },

  // Rating
  ratingSection: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 10,
  },
  ratingHeading: { fontWeight: "700", color: colors.ink, marginBottom: 6 },
  starsRow: { flexDirection: "row", gap: 6, marginBottom: 8 },
  star: { fontSize: 28 },
  commentInput: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: colors.ink,
    minHeight: 60,
    marginBottom: 8,
  },
  submitRatingBtn: {
    backgroundColor: colors.green,
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  submitRatingText: { color: "white", fontWeight: "700" },
  disabledBtn: { opacity: 0.5 },
  alreadyRated: { color: colors.okGreen, fontWeight: "600", marginTop: 8 },

  // Edit modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalTitle: { fontSize: 18, fontWeight: "800", color: colors.ink, marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: colors.muted, marginBottom: 4 },
  fieldInput: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    color: colors.ink,
    marginBottom: 12,
  },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  saveEditBtn: {
    flex: 1,
    backgroundColor: colors.green,
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
  },
  saveEditBtnText: { color: "white", fontWeight: "700", fontSize: 15 },
  cancelModalBtn: {
    flex: 1,
    backgroundColor: colors.paper,
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.line,
  },
  cancelModalBtnText: { color: colors.ink, fontWeight: "600", fontSize: 15 },
});
