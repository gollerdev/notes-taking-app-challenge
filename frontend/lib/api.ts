const BASE_URL =
  (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000") + "/api/v1";

const ACCESS_TOKEN_KEY = "access_token";

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

/** Central API wrapper. All HTTP calls to the backend go through here. */
export const api = {
  async get<T>(path: string): Promise<T> {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: "GET",
      headers: buildHeaders(),
    });
    return handleResponse<T>(response);
  },

  async post<T>(path: string, data?: unknown): Promise<T> {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: buildHeaders(),
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
    return handleResponse<T>(response);
  },

  async patch<T>(path: string, data?: unknown): Promise<T> {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: "PATCH",
      headers: buildHeaders(),
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
    return handleResponse<T>(response);
  },

  async delete<T>(path: string): Promise<T> {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: "DELETE",
      headers: buildHeaders(),
    });
    return handleResponse<T>(response);
  },
};
