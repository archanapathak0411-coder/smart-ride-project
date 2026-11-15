import { createContext, useContext, useEffect, useState } from "react";
import { getMe, login as loginRequest, register as registerRequest, updateMe } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("jc_token");
    if (!token) {
      setLoading(false);
      return;
    }
    getMe()
      .then((data) => setUser(data.user))
      .catch(() => localStorage.removeItem("jc_token"))
      .finally(() => setLoading(false));
  }, []);

  function saveSession(data) {
    localStorage.setItem("jc_token", data.access_token);
    setUser(data.user);
  }

  async function login(body) {
    const data = await loginRequest(body);
    saveSession(data);
    return data.user;
  }

  async function register(body) {
    const data = await registerRequest(body);
    saveSession(data);
    return data.user;
  }

  function logout() {
    localStorage.removeItem("jc_token");
    setUser(null);
  }

  async function saveProfile(body) {
    const data = await updateMe(body);
    setUser(data.user);
    return data.user;
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, saveProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
