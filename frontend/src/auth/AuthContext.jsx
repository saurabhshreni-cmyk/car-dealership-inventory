import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { createApi } from "../api/api";

const SESSION_KEY = "dealership.session";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const AuthContext = createContext(null);

function readSession() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SESSION_KEY));
    return parsed?.token && parsed?.user ? parsed : null;
  } catch {
    return null;
  }
}

/** Holds the JWT session, persists it, and exposes an authenticated api object. */
export function AuthProvider({ children, api: apiOverride }) {
  const [session, setSession] = useState(readSession);
  const tokenRef = useRef(session?.token ?? null);

  const logout = useCallback(() => {
    tokenRef.current = null;
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
  }, []);

  const api = useMemo(
    () =>
      apiOverride ??
      createApi({ baseUrl: API_BASE_URL, getToken: () => tokenRef.current, onUnauthorized: logout }),
    [apiOverride, logout],
  );

  const login = useCallback(
    async (email, password) => {
      const { access_token: token, user } = await api.login(email, password);
      const next = { token, user };
      tokenRef.current = token;
      localStorage.setItem(SESSION_KEY, JSON.stringify(next));
      setSession(next);
      return user;
    },
    [api],
  );

  const register = useCallback(
    async (email, password) => {
      await api.register(email, password);
      return login(email, password);
    },
    [api, login],
  );

  const value = useMemo(
    () => ({
      api,
      user: session?.user ?? null,
      isAuthenticated: Boolean(session),
      isAdmin: session?.user?.role === "admin",
      login,
      register,
      logout,
    }),
    [api, session, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
