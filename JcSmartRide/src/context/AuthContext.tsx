import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api, User } from "../api/client";

type AuthValue = {
  user: User | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (body: object) => Promise<User>;
  logout: () => Promise<void>;
  saveProfile: (body: object) => Promise<User>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("jc_token")
      .then(token => {
        if (!token) {
          return null;
        }
        return api("/api/auth/me").then(data => setUser(data.user));
      })
      .catch(() => AsyncStorage.removeItem("jc_token"))
      .finally(() => setReady(true));
  }, []);

  async function login(email: string, password: string) {
    const data = await api("/api/auth/login", { method: "POST", body: { email, password } });
    await AsyncStorage.setItem("jc_token", data.access_token);
    setUser(data.user);
    return data.user as User;
  }

  async function register(body: object) {
    const data = await api("/api/auth/register", { method: "POST", body });
    await AsyncStorage.setItem("jc_token", data.access_token);
    setUser(data.user);
    return data.user as User;
  }

  async function logout() {
    await AsyncStorage.removeItem("jc_token");
    setUser(null);
  }

  async function saveProfile(body: object) {
    const data = await api("/api/auth/me", { method: "PATCH", body });
    setUser(data.user);
    return data.user as User;
  }

  return (
    <AuthContext.Provider value={{ user, ready, login, register, logout, saveProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return value;
}
