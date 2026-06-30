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

const REFRESH_TOKEN_KEY = "refresh_token";

export function getStoredTokens(): { access: string | null; refresh: string | null } {
  if (typeof window === "undefined") {
    return { access: null, refresh: null };
  }
  return {
    access: localStorage.getItem("access_token"),
    refresh: localStorage.getItem(REFRESH_TOKEN_KEY),
  };
}

interface AuthState {
  access: string | null;
  refresh: string | null;
  isAuthenticated: boolean;
  login: (tokens: AuthTokens) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

/** Provides auth state persisted to localStorage so it survives page reloads. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [tokens, setTokens] = useState(getStoredTokens);

  useEffect(() => {
    const stored = localStorage.getItem("access_token");
    if (stored !== null) {
      setAccessToken(stored);
    }
  }, []);

  const login = useCallback((newTokens: AuthTokens) => {
    setTokens({ access: newTokens.access, refresh: newTokens.refresh });
    setAccessToken(newTokens.access);
    localStorage.setItem(REFRESH_TOKEN_KEY, newTokens.refresh);
  }, []);

  const logout = useCallback(() => {
    setTokens({ access: null, refresh: null });
    setAccessToken(null);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }, []);

  const value: AuthState = {
    access: tokens.access,
    refresh: tokens.refresh,
    isAuthenticated: tokens.access !== null,
    login,
    logout,
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
