import { describe, it, expect, vi, beforeEach } from "vitest";
import { notesService } from "./notes";
import { api } from "@/lib/api";
import { mockNote } from "@/test-utils/factories";
import type { CreateNotePayload } from "@/types";

vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("notesService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAll", () => {
    it("calls api.get with /notes/ and returns the result", async () => {
      const notes = [mockNote(), mockNote()];
      vi.mocked(api.get).mockResolvedValue(notes);

      const result = await notesService.getAll();

      expect(api.get).toHaveBeenCalledWith("/notes/");
      expect(api.get).toHaveBeenCalledTimes(1);
      expect(result).toBe(notes);
    });

    it("does not call any other api method", async () => {
      vi.mocked(api.get).mockResolvedValue([]);

      await notesService.getAll();

      expect(api.post).not.toHaveBeenCalled();
      expect(api.patch).not.toHaveBeenCalled();
      expect(api.delete).not.toHaveBeenCalled();
    });
  });

  describe("create", () => {
    it("calls api.post with /notes/ and the payload and returns the result", async () => {
      const payload: CreateNotePayload = {
        title: "Test Note",
        body: "Test body",
        category: "personal",
      };
      const created = mockNote(payload);
      vi.mocked(api.post).mockResolvedValue(created);

      const result = await notesService.create(payload);

      expect(api.post).toHaveBeenCalledWith("/notes/", payload);
      expect(api.post).toHaveBeenCalledTimes(1);
      expect(result).toBe(created);
    });

    it("does not call any other api method", async () => {
      const payload: CreateNotePayload = {
        title: "T",
        body: "B",
      };
      vi.mocked(api.post).mockResolvedValue(mockNote());

      await notesService.create(payload);

      expect(api.get).not.toHaveBeenCalled();
      expect(api.patch).not.toHaveBeenCalled();
      expect(api.delete).not.toHaveBeenCalled();
    });
  });
});
