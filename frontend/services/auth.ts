import { api } from "@/lib/api";
import type { AuthCredentials, AuthTokens } from "@/types";

/** Auth service — calls backend auth endpoints via lib/api. */
export const authService = {
  /** Register a new user and return JWT token pair. */
  async register(payload: AuthCredentials): Promise<AuthTokens> {
    return api.post<AuthTokens>("/auth/register/", payload);
  },

  /** Log in an existing user and return JWT token pair. */
  async login(payload: AuthCredentials): Promise<AuthTokens> {
    return api.post<AuthTokens>("/auth/login/", payload);
  },
};

/** Refresh the access token using a valid refresh token.
 *  Returns the new access token on success, throws on failure. */
export async function refreshAccessToken(refreshToken: string): Promise<string> {
  const result = await api.post<{ access: string }>("/auth/refresh/", {
    refresh: refreshToken,
  });
  return result.access;
}
