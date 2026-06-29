const BASE_URL =
  (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000") + "/api/v1";

/**
 * Returns the current access token if one exists.
 *
 * Token storage decision: deferred to the Auth ticket.
 * This single helper centralizes the read so the storage mechanism
 * (localStorage, httpOnly cookie, etc.) can be swapped without
 * touching call sites.
 */
function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
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
