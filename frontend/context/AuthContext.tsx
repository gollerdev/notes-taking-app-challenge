"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { setAccessToken } from "@/lib/api";
import type { AuthTokens } from "@/types";

interface AuthState {
  access: string | null;
  refresh: string | null;
  isAuthenticated: boolean;
  login: (tokens: AuthTokens) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

/** Provides in-memory auth state. Tokens are lost on refresh by design. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [tokens, setTokens] = useState<{
    access: string | null;
    refresh: string | null;
  }>({ access: null, refresh: null });

  const login = useCallback((newTokens: AuthTokens) => {
    setTokens({ access: newTokens.access, refresh: newTokens.refresh });
    setAccessToken(newTokens.access);
  }, []);

  const logout = useCallback(() => {
    setTokens({ access: null, refresh: null });
    setAccessToken(null);
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
