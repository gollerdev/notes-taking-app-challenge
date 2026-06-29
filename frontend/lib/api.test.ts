import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { api, ApiError } from "./api";

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

function jsonResponse(data: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  } as Response;
}

describe("api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear any stored token
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
    }
  });

  afterEach(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
    }
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
      } as unknown as Response;
      mockFetch.mockResolvedValue(noContentResponse);

      const result = await api.delete("/notes/1/");
      expect(result).toBeUndefined();

      const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("http://localhost:8000/api/v1/notes/1/");
      expect(options.method).toBe("DELETE");
    });
  });

  describe("auth headers", () => {
    it("includes Authorization header when token exists", async () => {
      localStorage.setItem("access_token", "test-token-123");
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
  });
});
