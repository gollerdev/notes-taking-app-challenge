import { describe, it, expect, vi, beforeEach } from "vitest";
import { authService, refreshAccessToken } from "./auth";
import { mockAuthPayload, mockAuthTokens } from "@/test-utils/factories";

vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import { api } from "@/lib/api";

describe("authService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("register", () => {
    it("calls api.post with /auth/register/ and the payload", async () => {
      const payload = mockAuthPayload();
      const tokens = mockAuthTokens();
      vi.mocked(api.post).mockResolvedValue(tokens);

      const result = await authService.register(payload);

      expect(result).toEqual(tokens);
      expect(api.post).toHaveBeenCalledOnce();
      expect(api.post).toHaveBeenCalledWith("/auth/register/", payload);
    });

    it("does not call any other api method", async () => {
      const payload = mockAuthPayload();
      vi.mocked(api.post).mockResolvedValue(mockAuthTokens());

      await authService.register(payload);

      expect(api.get).not.toHaveBeenCalled();
      expect(api.patch).not.toHaveBeenCalled();
      expect(api.delete).not.toHaveBeenCalled();
    });
  });

  describe("login", () => {
    it("calls api.post with /auth/login/ and the payload", async () => {
      const payload = mockAuthPayload();
      const tokens = mockAuthTokens();
      vi.mocked(api.post).mockResolvedValue(tokens);

      const result = await authService.login(payload);

      expect(result).toEqual(tokens);
      expect(api.post).toHaveBeenCalledOnce();
      expect(api.post).toHaveBeenCalledWith("/auth/login/", payload);
    });

    it("does not call any other api method", async () => {
      const payload = mockAuthPayload();
      vi.mocked(api.post).mockResolvedValue(mockAuthTokens());

      await authService.login(payload);

      expect(api.get).not.toHaveBeenCalled();
      expect(api.patch).not.toHaveBeenCalled();
      expect(api.delete).not.toHaveBeenCalled();
    });
  });
});

describe("refreshAccessToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls api.post with /auth/refresh/ and the refresh token, returns new access token", async () => {
    const newAccess = "new-access-token-xyz";
    vi.mocked(api.post).mockResolvedValue({ access: newAccess });

    const result = await refreshAccessToken("my-refresh-token");

    expect(result).toBe(newAccess);
    expect(api.post).toHaveBeenCalledOnce();
    expect(api.post).toHaveBeenCalledWith("/auth/refresh/", {
      refresh: "my-refresh-token",
    });
  });

  it("throws when the refresh endpoint returns an error", async () => {
    vi.mocked(api.post).mockRejectedValue(new Error("Token expired"));

    await expect(refreshAccessToken("expired-token")).rejects.toThrow("Token expired");
    expect(api.post).toHaveBeenCalledOnce();
  });

  it("does not call any other api method", async () => {
    vi.mocked(api.post).mockResolvedValue({ access: "token" });

    await refreshAccessToken("refresh-token");

    expect(api.get).not.toHaveBeenCalled();
    expect(api.patch).not.toHaveBeenCalled();
    expect(api.delete).not.toHaveBeenCalled();
  });
});
