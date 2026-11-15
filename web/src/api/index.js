import { api } from "./client";

export function register(body) {
  return api("/api/auth/register", { method: "POST", body });
}

export function login(body) {
  return api("/api/auth/login", { method: "POST", body });
}

export function getMe() {
  return api("/api/auth/me");
}

export function updateMe(body) {
  return api("/api/auth/me", { method: "PATCH", body });
}

export function checkVerificationStatus(identifier) {
  return api("/api/auth/verify-status", { method: "POST", body: { identifier } });
}

export function uploadStudentId(identifier, id_card_photo) {
  return api("/api/auth/upload-id", { method: "POST", body: { identifier, id_card_photo } });
}

export function getPlaces() {
  return api("/api/places");
}

export function createRide(body) {
  return api("/api/rides", { method: "POST", body });
}

export function getRideDetails(rideId) {
  return api("/api/rides/" + rideId);
}

export function updateRide(rideId, body) {
  return api("/api/rides/" + rideId, { method: "PATCH", body });
}

export function calculateFare(params) {
  return api("/api/rides/calculate-fare", { method: "POST", body: params });
}

export function searchRides(body) {
  return api("/api/rides/search", { method: "POST", body });
}

export function myRides() {
  return api("/api/rides/mine");
}

export function cancelRide(rideId) {
  return api("/api/rides/" + rideId + "/cancel", { method: "POST" });
}

export function completeRide(rideId) {
  return api("/api/rides/" + rideId + "/complete", { method: "POST" });
}

export function requestBooking(body) {
  return api("/api/bookings", { method: "POST", body });
}

export function myBookings() {
  return api("/api/bookings/mine");
}

export function acceptBooking(bookingId) {
  return api("/api/bookings/" + bookingId + "/accept", { method: "POST" });
}

export function rejectBooking(bookingId) {
  return api("/api/bookings/" + bookingId + "/reject", { method: "POST" });
}

export function cancelBooking(bookingId) {
  return api("/api/bookings/" + bookingId + "/cancel", { method: "POST" });
}

export function createRating(body) {
  return api("/api/ratings", { method: "POST", body });
}

export function getSavings(month) {
  const query = month ? "?month=" + month : "";
  return api("/api/savings" + query);
}

export function adminStudents() {
  return api("/api/admin/students");
}

export function verifyStudent(userId) {
  return api("/api/admin/students/" + userId + "/verify", { method: "POST" });
}

export function rejectStudent(userId) {
  return api("/api/admin/students/" + userId + "/reject", { method: "POST" });
}

export function deleteStudent(userId) {
  return api("/api/admin/students/" + userId, { method: "DELETE" });
}

export function adminUploadPhoto(userId, id_card_photo) {
  return api("/api/admin/students/" + userId + "/photo", { method: "POST", body: { id_card_photo } });
}

export function adminRides() {
  return api("/api/admin/rides");
}

export function adminBookings() {
  return api("/api/admin/bookings");
}

export function adminCancelRide(rideId) {
  return api("/api/admin/rides/" + rideId + "/cancel", { method: "POST" });
}
