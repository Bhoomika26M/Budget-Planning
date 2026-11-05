import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import api, { clearToken, getToken, saveToken } from "../services/api";
import { toProfile } from "../services/mappers";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore the session from a saved token on first load.
  useEffect(() => {
    let active = true;
    async function restore() {
      if (!getToken()) {
        setLoading(false);
        return;
      }
      try {
        const me = await api.me();
        if (active) setUser(toProfile(me));
      } catch {
        clearToken();
      } finally {
        if (active) setLoading(false);
      }
    }
    restore();

    const onUnauthorized = () => setUser(null);
    window.addEventListener("bb:unauthorized", onUnauthorized);
    return () => {
      active = false;
      window.removeEventListener("bb:unauthorized", onUnauthorized);
    };
  }, []);

  const login = useCallback(async (email, password, remember = true) => {
    const result = await api.login({ email: email.trim(), password });
    saveToken(result.access_token, remember);
    const me = toProfile(result.user || (await api.me()));
    setUser(me);
    return me;
  }, []);

  // Used by the OAuth callback page (token arrives in the URL).
  const loginWithToken = useCallback(async (token) => {
    saveToken(token, true);
    const me = toProfile(await api.me());
    setUser(me);
    return me;
  }, []);

  const register = useCallback(async ({ name, email, password }) => {
    return api.register({ name: name.trim(), email: email.trim(), password });
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const me = toProfile(await api.me());
    setUser(me);
    return me;
  }, []);

  const updateProfile = useCallback(async (data) => {
    const me = toProfile(await api.updateProfile(data));
    setUser(me);
    return me;
  }, []);

  const upgrade = useCallback(async (paymentMethod = "upi") => {
    const me = toProfile(await api.upgrade(paymentMethod));
    setUser(me);
    return me;
  }, []);

  const value = useMemo(
    () => ({ user, setUser, loading, login, loginWithToken, register, logout, refreshUser, updateProfile, upgrade }),
    [user, loading, login, loginWithToken, register, logout, refreshUser, updateProfile, upgrade]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
