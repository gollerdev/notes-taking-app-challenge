"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { setAccessToken } from "@/lib/api";
import type { AuthTokens } from "@/types";

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

interface AuthState {
  access: string | null;
  refresh: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  login: (tokens: AuthTokens) => void;
  logout: () => void;
  clearSession: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

/** Provides auth state persisted to localStorage so it survives page reloads.
 *  Initializes with null tokens (server-consistent) and restores from
 *  localStorage after mount to avoid hydration mismatches. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [tokens, setTokens] = useState<{
    access: string | null;
    refresh: string | null;
  }>({ access: null, refresh: null });
  const [isHydrated, setIsHydrated] = useState(false);

  // Post-mount restore: read localStorage after mount to avoid hydration mismatch
  useEffect(() => {
    const storedAccess = localStorage.getItem(ACCESS_TOKEN_KEY);
    const storedRefresh = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (storedAccess !== null) {
      setTokens({ access: storedAccess, refresh: storedRefresh });
      setAccessToken(storedAccess);
    }
    setIsHydrated(true);
  }, []);

  const login = useCallback((newTokens: AuthTokens) => {
    setTokens({ access: newTokens.access, refresh: newTokens.refresh });
    setAccessToken(newTokens.access);
    localStorage.setItem(ACCESS_TOKEN_KEY, newTokens.access);
    localStorage.setItem(REFRESH_TOKEN_KEY, newTokens.refresh);
  }, []);

  const clearSession = useCallback(() => {
    setTokens({ access: null, refresh: null });
    setAccessToken(null);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }, []);

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const value: AuthState = {
    access: tokens.access,
    refresh: tokens.refresh,
    isAuthenticated: tokens.access !== null,
    isHydrated,
    login,
    logout,
    clearSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Hook to access auth state. Throws if used outside AuthProvider. */
export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
