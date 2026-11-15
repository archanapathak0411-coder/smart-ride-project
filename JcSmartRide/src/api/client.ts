import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../config";

export type User = {
  id: number;
  name: string;
  email: string;
  phone: string;
  student_id: string;
  role: string;
  verification_status: string;
  women_only_preference: boolean;
  typical_solo_fare: number | null;
  branch?: string;
  has_id_card?: boolean;
  id_card_photo?: string | null;
};

export type Place = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
};

export type Ride = {
  id: number;
  driver: { id: number; name: string; average_rating: number | null; rating_count: number; phone?: string; branch?: string; student_id?: string };
  pickup: Place;
  drop: Place;
  ride_date: string;
  ride_time: string;
  seats_total: number;
  seats_available: number;
  cost_per_seat: number;
  women_only: boolean;
  status: string;
  match_score?: number;
  reasons?: string[];
  bookings?: Array<{
    id: number;
    status: string;
    passenger: {
      id: number;
      name: string;
      phone?: string;
      student_id?: string;
      branch?: string;
    };
  }>;
};

export type VerificationStudent = {
  id: number;
  name: string;
  email: string;
  student_id: string;
  branch: string;
  verification_status: string;
  has_id_card: boolean;
  id_card_photo?: string | null;
};

export type FareQuote = {
  road_distance_km: number;
  estimated_duration_mins: number;
  recommended_fare: number;
  fare_range: { min: number; max: number };
  solo_auto_fare: number;
  solo_cab_fare: number;
  savings_vs_auto: number;
};

export async function api(path: string, options: { method?: string; body?: object } = {}) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = await AsyncStorage.getItem("jc_token");
  if (token) {
    headers.Authorization = "Bearer " + token;
  }
  const response = await fetch(API_URL + path, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Something went wrong");
  }
  return data;
}

// Auth extras
export function checkVerificationStatus(identifier: string) {
  return api("/api/auth/verify-status", { method: "POST", body: { identifier } });
}
export function uploadStudentId(identifier: string, id_card_photo: string) {
  return api("/api/auth/upload-id", { method: "POST", body: { identifier, id_card_photo } });
}

// Places
export function getPlaces() {
  return api("/api/places");
}

// Rides
export function createRide(body: object) { return api("/api/rides", { method: "POST", body }); }
export function getRideDetails(rideId: number) { return api("/api/rides/" + rideId); }
export function updateRide(rideId: number, body: object) { return api("/api/rides/" + rideId, { method: "PATCH", body }); }
export function calculateFare(params: object) { return api("/api/rides/calculate-fare", { method: "POST", body: params }); }
export function searchRides(body: object) { return api("/api/rides/search", { method: "POST", body }); }
export function myRides() { return api("/api/rides/mine"); }
export function cancelRide(rideId: number) { return api("/api/rides/" + rideId + "/cancel", { method: "POST" }); }
export function completeRide(rideId: number) { return api("/api/rides/" + rideId + "/complete", { method: "POST" }); }

// Bookings
export function requestBooking(body: object) { return api('/api/bookings', { method: 'POST', body }); }
export function myBookings() { return api('/api/bookings/mine'); }
export function acceptBooking(bookingId: number) { return api('/api/bookings/' + bookingId + '/accept', { method: 'POST' }); }
export function rejectBooking(bookingId: number) { return api('/api/bookings/' + bookingId + '/reject', { method: 'POST' }); }
export function cancelBooking(bookingId: number) { return api('/api/bookings/' + bookingId + '/cancel', { method: 'POST' }); }

// Ratings
export function createRating(body: object) { return api('/api/ratings', { method: 'POST', body }); }

// Savings
export function getSavings(month?: string) {
  const query = month ? '?month=' + month : '';
  return api('/api/savings' + query);
}

// Admin
export function adminStudents() { return api('/api/admin/students'); }
export function verifyStudent(userId: number) { return api('/api/admin/students/' + userId + '/verify', { method: 'POST' }); }
export function rejectStudent(userId: number) { return api('/api/admin/students/' + userId + '/reject', { method: 'POST' }); }
export function deleteStudent(userId: number) { return api('/api/admin/students/' + userId, { method: 'DELETE' }); }
export function adminUploadPhoto(userId: number, id_card_photo: string) { return api('/api/admin/students/' + userId + '/photo', { method: 'POST', body: { id_card_photo } }); }
export function adminRides() { return api('/api/admin/rides'); }
export function adminBookings() { return api('/api/admin/bookings'); }
export function adminCancelRide(rideId: number) { return api('/api/admin/rides/' + rideId + '/cancel', { method: 'POST' }); }
