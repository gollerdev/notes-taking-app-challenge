import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useNotes } from "./useNotes";
import { notesService } from "@/services/notes";
import { mockNote } from "@/test-utils/factories";

vi.mock("@/services/notes", () => ({
  notesService: {
    getAll: vi.fn(),
    create: vi.fn(),
  },
}));

describe("useNotes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls notesService.getAll on mount", async () => {
    const notes = [mockNote(), mockNote()];
    vi.mocked(notesService.getAll).mockResolvedValue(notes);

    const { result } = renderHook(() => useNotes());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(notesService.getAll).toHaveBeenCalledTimes(1);
    expect(result.current.notes).toEqual(notes);
  });

  it("does not call any other notesService method", async () => {
    vi.mocked(notesService.getAll).mockResolvedValue([]);

    const { result } = renderHook(() => useNotes());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(notesService.create).not.toHaveBeenCalled();
  });

  it("starts with loading true and sets it to false after fetch", async () => {
    vi.mocked(notesService.getAll).mockResolvedValue([]);

    const { result } = renderHook(() => useNotes());

    // Initially loading
    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.notes).toEqual([]);
  });

  it("sets error to true and loading to false when getAll rejects", async () => {
    vi.mocked(notesService.getAll).mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useNotes());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe(true);
    expect(result.current.notes).toEqual([]);
  });

  it("has error false on successful fetch", async () => {
    vi.mocked(notesService.getAll).mockResolvedValue([mockNote()]);

    const { result } = renderHook(() => useNotes());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe(false);
  });
});
