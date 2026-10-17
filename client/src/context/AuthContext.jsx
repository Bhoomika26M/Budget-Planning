import { useCallback, useEffect, useMemo, useState } from "react";
import AuthContext from "./auth-context";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
const TOKEN_KEY = "budgetbuddy-access-token";
async function readJson(response, fallback) {
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = body?.detail;
    throw new Error(typeof detail === "string" ? detail : fallback);
  }
  return body;
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY));
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState("");

  const logout = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setCurrentUser(null);
    setSessionError("");
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadUser() {
      if (!token) {
        setCurrentUser(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const user = await readJson(response, "Your session has expired. Please sign in again.");
        if (!cancelled) setCurrentUser(user);
      } catch (error) {
        if (!cancelled) {
          sessionStorage.removeItem(TOKEN_KEY);
          setToken(null);
          setCurrentUser(null);
          setSessionError(error.message || "Unable to validate your session. Please sign in again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadUser();
    return () => {
      cancelled = true;
    };
  }, [token, logout]);

  const login = useCallback(async (email, password, portal) => {
    const form = new URLSearchParams({ username: email, password });
    const tokenResponse = await fetch(`${API_BASE_URL}/auth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
    });
    const tokenData = await readJson(tokenResponse, "Unable to sign in.");
    const profileResponse = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const user = await readJson(profileResponse, "Unable to load your account.");

    if (portal === "admin" && user.role !== "admin") {
      throw new Error("This portal is restricted to administrators.");
    }
    if (portal === "premium" && user.role !== "premium") {
      throw new Error("This portal is for Premium members.");
    }
    if (portal === "student" && user.role === "admin") {
      throw new Error("Administrator accounts must use the Admin Portal.");
    }

    sessionStorage.setItem(TOKEN_KEY, tokenData.access_token);
    setToken(tokenData.access_token);
    setCurrentUser(user);
    setSessionError("");
    return user;
  }, []);

  const register = useCallback(async ({ name, email, password }) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    return readJson(response, "Unable to create your account.");
  }, []);

  const updateUserProfile = useCallback(async (profile) => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(profile),
    });
    const updatedUser = await readJson(response, "Unable to update your profile.");
    setCurrentUser(updatedUser);
    return updatedUser;
  }, [token]);

  const value = useMemo(
    () => ({
      currentUser,
      token,
      loading,
      sessionError,
      login,
      register,
      logout,
      updateUserProfile,
    }),
    [currentUser, token, loading, sessionError, login, register, logout, updateUserProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
