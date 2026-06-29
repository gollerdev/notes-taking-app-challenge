import { describe, it, expect, vi, beforeEach } from "vitest";
import { authService } from "./auth";
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
