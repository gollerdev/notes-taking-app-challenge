const BASE_URL =
  (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000") + "/api/v1";

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

let accessToken: string | null = null;

/** Sets the access token in memory and persists it to localStorage. Pass null to clear on logout. */
export function setAccessToken(token: string | null): void {
  accessToken = token;
  if (typeof window !== "undefined") {
    if (token !== null) {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
    }
  }
}

/** Returns the in-memory access token, falling back to localStorage (e.g. after a page reload). */
function getAccessToken(): string | null {
  if (accessToken !== null) return accessToken;
  if (typeof window !== "undefined") {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }
  return null;
}

/** Builds common headers including Authorization when a token is present. */
function buildHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...extra,
  };
  const token = getAccessToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

/** Normalized API error with status code and parsed body. */
export class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown,
  ) {
    super(`API error ${status}`);
    this.name = "ApiError";
  }
}

/** Handles fetch response: throws ApiError on non-2xx, returns parsed JSON. */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      body = await response.text();
    }
    throw new ApiError(response.status, body);
  }
  // 204 No Content (and other empty-body success responses, e.g. from DELETE)
  // have no JSON to parse; response.json() would throw on the empty body.
  // Callers of 204-producing endpoints should declare <void> (e.g. api.delete<void>())
  // so TypeScript reflects the actual undefined value rather than a misleading type.
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

// --- 401 interceptor: refresh token logic ---

/** Mutex for token refresh to prevent concurrent refresh attempts. */
let refreshPromise: Promise<string> | null = null;

/** Attempts to refresh the access token using the stored refresh token.
 *  Uses raw fetch (not the api wrapper) to avoid recursive 401 interception.
 *  Only one refresh attempt is in-flight at a time — concurrent callers
 *  share the same promise. */
async function attemptTokenRefresh(): Promise<string> {
  if (refreshPromise !== null) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const refreshToken =
      typeof window !== "undefined" ? localStorage.getItem(REFRESH_TOKEN_KEY) : null;

    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const response = await fetch(`${BASE_URL}/auth/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      throw new Error("Token refresh failed");
    }

    const data = (await response.json()) as { access: string };
    return data.access;
  })();

  try {
    const newToken = await refreshPromise;
    return newToken;
  } finally {
    refreshPromise = null;
  }
}

/** Clears the session (tokens from memory and localStorage) and redirects to /login. */
function clearSessionAndRedirect(): void {
  accessToken = null;
  if (typeof window !== "undefined") {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    window.location.href = "/login";
  }
}

/** Wraps an API call with 401 interception: on 401, attempts a single token
 *  refresh and retries the original request exactly once. On refresh failure,
 *  clears the session and redirects to /login. */
async function withRefreshRetry<T>(requestFn: () => Promise<Response>): Promise<T> {
  const response = await requestFn();

  if (response.status !== 401) {
    return handleResponse<T>(response);
  }

  // 401 received — attempt token refresh
  try {
    const newToken = await attemptTokenRefresh();
    setAccessToken(newToken);
  } catch {
    clearSessionAndRedirect();
    // Re-throw the original 401 error so callers can handle it
    let body: unknown;
    try {
      body = await response.clone().json();
    } catch {
      body = await response.clone().text();
    }
    throw new ApiError(401, body);
  }

  // Retry the original request with the new token
  const retryResponse = await requestFn();
  return handleResponse<T>(retryResponse);
}

// Expose for testing
export { clearSessionAndRedirect as _clearSessionAndRedirect };

/** Central API wrapper. All HTTP calls to the backend go through here. */
export const api = {
  async get<T>(path: string): Promise<T> {
    return withRefreshRetry<T>(() =>
      fetch(`${BASE_URL}${path}`, {
        method: "GET",
        headers: buildHeaders(),
      }),
    );
  },

  async post<T>(path: string, data?: unknown): Promise<T> {
    return withRefreshRetry<T>(() =>
      fetch(`${BASE_URL}${path}`, {
        method: "POST",
        headers: buildHeaders(),
        body: data !== undefined ? JSON.stringify(data) : undefined,
      }),
    );
  },

  async patch<T>(path: string, data?: unknown): Promise<T> {
    return withRefreshRetry<T>(() =>
      fetch(`${BASE_URL}${path}`, {
        method: "PATCH",
        headers: buildHeaders(),
        body: data !== undefined ? JSON.stringify(data) : undefined,
      }),
    );
  },

  async delete<T>(path: string): Promise<T> {
    return withRefreshRetry<T>(() =>
      fetch(`${BASE_URL}${path}`, {
        method: "DELETE",
        headers: buildHeaders(),
      }),
    );
  },
};
