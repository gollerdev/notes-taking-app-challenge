import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { api, ApiError, setAccessToken, _clearSessionAndRedirect } from "./api";

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

function jsonResponse(data: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    clone() {
      return jsonResponse(data, status);
    },
  } as Response;
}

describe("api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear in-memory token
    setAccessToken(null);
  });

  afterEach(() => {
    setAccessToken(null);
  });

  describe("get", () => {
    it("sends a GET request and returns parsed JSON", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ status: "ok" }));
      const result = await api.get<{ status: string }>("/health/");

      expect(result).toEqual({ status: "ok" });
      expect(mockFetch).toHaveBeenCalledOnce();

      const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("http://localhost:8000/api/v1/health/");
      expect(options.method).toBe("GET");
    });

    it("throws ApiError on non-2xx response", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ detail: "Not found" }, 404));

      let caughtError: unknown;
      try {
        await api.get("/missing/");
      } catch (error) {
        caughtError = error;
      }

      expect(caughtError).toBeInstanceOf(ApiError);
      const apiError = caughtError as ApiError;
      expect(apiError.status).toBe(404);
      expect(apiError.body).toEqual({ detail: "Not found" });
      expect(mockFetch).toHaveBeenCalledOnce();
    });

    it("throws ApiError with text body when JSON parse fails", async () => {
      const badResponse = {
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error("invalid json")),
        text: () => Promise.resolve("Internal Server Error"),
        clone() {
          return badResponse;
        },
      } as unknown as Response;
      mockFetch.mockResolvedValue(badResponse);

      await expect(api.get("/broken/")).rejects.toThrow(ApiError);
    });
  });

  describe("post", () => {
    it("sends a POST request with JSON body", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ id: "1" }, 201));
      const result = await api.post<{ id: string }>("/notes/", {
        title: "Test",
      });

      expect(result).toEqual({ id: "1" });
      const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("http://localhost:8000/api/v1/notes/");
      expect(options.method).toBe("POST");
      expect(options.body).toBe(JSON.stringify({ title: "Test" }));
    });

    it("sends POST without body when data is undefined", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ ok: true }));
      await api.post("/action/");

      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(options.body).toBeUndefined();
    });

    it("serializes falsy-but-defined bodies (e.g. false, 0)", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ ok: true }));
      await api.post("/flag/", false);

      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(options.body).toBe(JSON.stringify(false));
    });
  });

  describe("patch", () => {
    it("sends a PATCH request with JSON body", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ id: "1" }));
      await api.patch("/notes/1/", { title: "Updated" });

      const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("http://localhost:8000/api/v1/notes/1/");
      expect(options.method).toBe("PATCH");
      expect(options.body).toBe(JSON.stringify({ title: "Updated" }));
    });

    it("sends PATCH without body when data is undefined", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ ok: true }));
      await api.patch("/notes/1/");

      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(options.body).toBeUndefined();
    });
  });

  describe("delete", () => {
    it("sends a DELETE request and resolves to undefined on 204 No Content", async () => {
      // A real 204 response has an empty body; response.json() would reject.
      const noContentResponse = {
        ok: true,
        status: 204,
        json: () => Promise.reject(new Error("Unexpected end of JSON input")),
        text: () => Promise.resolve(""),
        clone() {
          return noContentResponse;
        },
      } as unknown as Response;
      mockFetch.mockResolvedValue(noContentResponse);

      const result = await api.delete("/notes/1/");
      expect(result).toBeUndefined();

      const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("http://localhost:8000/api/v1/notes/1/");
      expect(options.method).toBe("DELETE");
    });
  });

  describe("setAccessToken", () => {
    it("writes token to localStorage", () => {
      setAccessToken("stored-token");
      expect(localStorage.getItem("access_token")).toBe("stored-token");
    });

    it("removes token from localStorage when called with null", () => {
      setAccessToken("stored-token");
      setAccessToken(null);
      expect(localStorage.getItem("access_token")).toBeNull();
    });
  });

  describe("auth headers", () => {
    it("includes Authorization header when token exists", async () => {
      setAccessToken("test-token-123");
      mockFetch.mockResolvedValue(jsonResponse({ ok: true }));

      await api.get("/notes/");

      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      const headers = options.headers as Record<string, string>;
      expect(headers["Authorization"]).toBe("Bearer test-token-123");
    });

    it("omits Authorization header when no token exists", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ ok: true }));

      await api.get("/notes/");

      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      const headers = options.headers as Record<string, string>;
      expect(headers["Authorization"]).toBeUndefined();
    });

    it("reads Authorization token from localStorage when in-memory token is absent", async () => {
      // setAccessToken(null) in beforeEach cleared localStorage; set it directly to simulate a reload
      localStorage.setItem("access_token", "persisted-token");
      mockFetch.mockResolvedValue(jsonResponse({ ok: true }));

      await api.get("/notes/");

      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      const headers = options.headers as Record<string, string>;
      expect(headers["Authorization"]).toBe("Bearer persisted-token");
    });
  });

  describe("SSR (window undefined)", () => {
    it("setAccessToken skips localStorage when window is undefined", () => {
      vi.stubGlobal("window", undefined);
      setAccessToken("ssr-token");
      vi.unstubAllGlobals();
      expect(localStorage.getItem("access_token")).toBeNull();
    });

    it("omits Authorization header when window is undefined and no in-memory token", async () => {
      vi.stubGlobal("window", undefined);
      mockFetch.mockResolvedValue(jsonResponse({ ok: true }));
      await api.get("/notes/");
      vi.unstubAllGlobals();
      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      const headers = options.headers as Record<string, string>;
      expect(headers["Authorization"]).toBeUndefined();
    });
  });

  describe("environment-dependent behavior", () => {
    const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;

    afterEach(() => {
      if (originalApiUrl === undefined) {
        delete process.env.NEXT_PUBLIC_API_URL;
      } else {
        process.env.NEXT_PUBLIC_API_URL = originalApiUrl;
      }
      vi.resetModules();
    });

    it("uses NEXT_PUBLIC_API_URL as the base URL when it is set", async () => {
      process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";
      vi.resetModules();
      const { api: freshApi } = await import("./api");
      mockFetch.mockResolvedValue(jsonResponse({ ok: true }));

      await freshApi.get("/health/");

      const [url] = mockFetch.mock.calls[0] as [string];
      expect(url).toBe("https://api.example.com/api/v1/health/");
    });

    it("falls back to localhost when NEXT_PUBLIC_API_URL is unset", async () => {
      delete process.env.NEXT_PUBLIC_API_URL;
      vi.resetModules();
      const { api: freshApi } = await import("./api");
      mockFetch.mockResolvedValue(jsonResponse({ ok: true }));

      await freshApi.get("/health/");

      const [url] = mockFetch.mock.calls[0] as [string];
      expect(url).toBe("http://localhost:8000/api/v1/health/");
    });
  });

  describe("401 interceptor", () => {
    it("attempts token refresh on 401 and retries the original request", async () => {
      localStorage.setItem("refresh_token", "valid-refresh");
      setAccessToken("expired-access");

      // First call: 401. Refresh call: success. Retry: success.
      mockFetch
        .mockResolvedValueOnce(jsonResponse({ detail: "Unauthorized" }, 401))
        .mockResolvedValueOnce(jsonResponse({ access: "new-access-token" }, 200))
        .mockResolvedValueOnce(jsonResponse({ data: "success" }, 200));

      const result = await api.get<{ data: string }>("/notes/");

      expect(result).toEqual({ data: "success" });
      // 3 fetch calls: original, refresh, retry
      expect(mockFetch).toHaveBeenCalledTimes(3);

      // Verify refresh call
      const [refreshUrl, refreshOptions] = mockFetch.mock.calls[1] as [
        string,
        RequestInit,
      ];
      expect(refreshUrl).toBe("http://localhost:8000/api/v1/auth/refresh/");
      expect(refreshOptions.method).toBe("POST");
      expect(refreshOptions.body).toBe(JSON.stringify({ refresh: "valid-refresh" }));

      // Verify the new access token was stored
      expect(localStorage.getItem("access_token")).toBe("new-access-token");
    });

    it("clears session and redirects to /login when refresh fails", async () => {
      localStorage.setItem("refresh_token", "expired-refresh");
      localStorage.setItem("access_token", "expired-access");
      setAccessToken("expired-access");

      // Mock window.location
      const originalLocation = window.location;
      Object.defineProperty(window, "location", {
        writable: true,
        value: { ...originalLocation, href: "/" },
      });

      // First call: 401. Refresh call: fails.
      mockFetch
        .mockResolvedValueOnce(jsonResponse({ detail: "Unauthorized" }, 401))
        .mockResolvedValueOnce(jsonResponse({ detail: "Token is invalid" }, 401));

      await expect(api.get("/notes/")).rejects.toThrow(ApiError);

      // Session should be cleared
      expect(localStorage.getItem("access_token")).toBeNull();
      expect(localStorage.getItem("refresh_token")).toBeNull();
      expect(window.location.href).toBe("/login");

      // Restore location
      Object.defineProperty(window, "location", {
        writable: true,
        value: originalLocation,
      });
    });

    it("falls back to text body when 401 response clone json parse fails", async () => {
      localStorage.setItem("refresh_token", "expired-refresh");
      setAccessToken("expired-access");

      const originalLocation = window.location;
      Object.defineProperty(window, "location", {
        writable: true,
        value: { ...originalLocation, href: "/" },
      });

      // 401 response whose body is not valid JSON
      const bad401 = {
        ok: false,
        status: 401,
        json: () => Promise.reject(new Error("invalid json")),
        text: () => Promise.resolve("Unauthorized plain text"),
        clone() {
          return bad401;
        },
      } as unknown as Response;

      mockFetch
        .mockResolvedValueOnce(bad401)
        .mockResolvedValueOnce(jsonResponse({ detail: "Token is invalid" }, 401));

      let caughtError: unknown;
      try {
        await api.get("/notes/");
      } catch (error) {
        caughtError = error;
      }

      expect(caughtError).toBeInstanceOf(ApiError);
      const apiError = caughtError as ApiError;
      expect(apiError.status).toBe(401);
      expect(apiError.body).toBe("Unauthorized plain text");

      Object.defineProperty(window, "location", {
        writable: true,
        value: originalLocation,
      });
    });

    it("clears session and redirects when no refresh token exists", async () => {
      // No refresh token in localStorage
      setAccessToken("expired-access");

      const originalLocation = window.location;
      Object.defineProperty(window, "location", {
        writable: true,
        value: { ...originalLocation, href: "/" },
      });

      mockFetch.mockResolvedValueOnce(jsonResponse({ detail: "Unauthorized" }, 401));

      await expect(api.get("/notes/")).rejects.toThrow(ApiError);

      expect(localStorage.getItem("access_token")).toBeNull();
      expect(window.location.href).toBe("/login");

      Object.defineProperty(window, "location", {
        writable: true,
        value: originalLocation,
      });
    });

    it("treats window-undefined as no refresh token (SSR path)", async () => {
      setAccessToken("expired-access");

      vi.stubGlobal("window", undefined);

      mockFetch.mockResolvedValueOnce(jsonResponse({ detail: "Unauthorized" }, 401));

      await expect(api.get("/notes/")).rejects.toThrow(ApiError);

      vi.unstubAllGlobals();
    });

    it("makes only one refresh call for concurrent 401s", async () => {
      localStorage.setItem("refresh_token", "valid-refresh");
      setAccessToken("expired-access");

      let refreshCallCount = 0;
      mockFetch.mockImplementation((url: string): Promise<Response> => {
        if (typeof url === "string" && url.includes("/auth/refresh/")) {
          refreshCallCount++;
          return Promise.resolve(jsonResponse({ access: "new-access" }, 200));
        }
        // First call for each request: 401, then after refresh: 200
        // We track calls by counting
        if (typeof url === "string" && url.includes("/notes/")) {
          const callsForNotes = (
            mockFetch.mock.calls as [string, RequestInit?][]
          ).filter((c) => typeof c[0] === "string" && c[0].includes("/notes/")).length;
          // First two calls (one per concurrent request) return 401
          // Subsequent calls (retries) return 200
          if (callsForNotes <= 2) {
            return Promise.resolve(jsonResponse({ detail: "Unauthorized" }, 401));
          }
          return Promise.resolve(jsonResponse({ data: "ok" }, 200));
        }
        return Promise.resolve(jsonResponse({}, 200));
      });

      const [r1, r2] = await Promise.all([
        api.get<{ data: string }>("/notes/"),
        api.get<{ data: string }>("/notes/"),
      ]);

      expect(r1).toEqual({ data: "ok" });
      expect(r2).toEqual({ data: "ok" });
      // Only one refresh call should have been made
      expect(refreshCallCount).toBe(1);
    });

    it("passes through non-401 errors unchanged", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ detail: "Server Error" }, 500));

      let caughtError: unknown;
      try {
        await api.get("/broken/");
      } catch (error) {
        caughtError = error;
      }

      expect(caughtError).toBeInstanceOf(ApiError);
      const apiError = caughtError as ApiError;
      expect(apiError.status).toBe(500);
      // Should not attempt refresh
      expect(mockFetch).toHaveBeenCalledOnce();
    });

    it("401 interceptor works for POST requests", async () => {
      localStorage.setItem("refresh_token", "valid-refresh");
      setAccessToken("expired-access");

      mockFetch
        .mockResolvedValueOnce(jsonResponse({ detail: "Unauthorized" }, 401))
        .mockResolvedValueOnce(jsonResponse({ access: "new-access-token" }, 200))
        .mockResolvedValueOnce(jsonResponse({ id: "1" }, 201));

      const result = await api.post<{ id: string }>("/notes/", {
        title: "Test",
      });

      expect(result).toEqual({ id: "1" });
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it("401 interceptor works for PATCH requests", async () => {
      localStorage.setItem("refresh_token", "valid-refresh");
      setAccessToken("expired-access");

      mockFetch
        .mockResolvedValueOnce(jsonResponse({ detail: "Unauthorized" }, 401))
        .mockResolvedValueOnce(jsonResponse({ access: "new-access-token" }, 200))
        .mockResolvedValueOnce(jsonResponse({ id: "1" }, 200));

      const result = await api.patch<{ id: string }>("/notes/1/", {
        title: "Updated",
      });

      expect(result).toEqual({ id: "1" });
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it("401 interceptor works for DELETE requests", async () => {
      localStorage.setItem("refresh_token", "valid-refresh");
      setAccessToken("expired-access");

      const noContentResponse = {
        ok: true,
        status: 204,
        json: () => Promise.reject(new Error("Unexpected end of JSON input")),
        text: () => Promise.resolve(""),
        clone() {
          return noContentResponse;
        },
      } as unknown as Response;

      mockFetch
        .mockResolvedValueOnce(jsonResponse({ detail: "Unauthorized" }, 401))
        .mockResolvedValueOnce(jsonResponse({ access: "new-access-token" }, 200))
        .mockResolvedValueOnce(noContentResponse);

      const result = await api.delete("/notes/1/");

      expect(result).toBeUndefined();
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });

  describe("clearSessionAndRedirect", () => {
    it("clears tokens and redirects to /login", () => {
      setAccessToken("some-token");
      localStorage.setItem("refresh_token", "some-refresh");

      const originalLocation = window.location;
      Object.defineProperty(window, "location", {
        writable: true,
        value: { ...originalLocation, href: "/" },
      });

      _clearSessionAndRedirect();

      expect(localStorage.getItem("access_token")).toBeNull();
      expect(localStorage.getItem("refresh_token")).toBeNull();
      expect(window.location.href).toBe("/login");

      Object.defineProperty(window, "location", {
        writable: true,
        value: originalLocation,
      });
    });
  });
});
