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
};

export type Place = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
};

export type Ride = {
  id: number;
  driver: { id: number; name: string; average_rating: number | null; rating_count: number };
  pickup: Place;
  drop: Place;
  ride_date: string;
  ride_time: string;
  seats_total: number;
  seats_available: number;
  cost_per_seat: number;
  women_only: boolean;
  status: string;
  bookings?: Array<{ id: number; status: string; passenger: { id: number; name: string } }>;
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
