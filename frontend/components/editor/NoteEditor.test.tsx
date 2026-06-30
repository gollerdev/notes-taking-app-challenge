import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { NoteEditor } from "./NoteEditor";
import { notesService } from "@/services/notes";
import { mockNote } from "@/test-utils/factories";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock notesService
vi.mock("@/services/notes", () => ({
  notesService: {
    patch: vi.fn(),
  },
}));

describe("NoteEditor", () => {
  const note = mockNote({
    title: "Test Title",
    body: "Test body content",
    category: "personal",
    updated_at: "2024-07-21T20:39:00.000Z",
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders TitleInput, BodyTextarea, EditorHeader, and LastEditedStamp inside the card", () => {
    const { container } = render(<NoteEditor note={note} />);
    expect(screen.getByDisplayValue("Test Title")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Test body content")).toBeInTheDocument();
    expect(screen.getByText("Personal")).toBeInTheDocument();
    // LastEditedStamp renders inside the card div (not in EditorHeader)
    const stampEl = screen.getByText(/Last Edited:/);
    expect(stampEl).toBeInTheDocument();
    const cardDiv = container.querySelector(".rounded-\\[11px\\]");
    expect(cardDiv).not.toBeNull();
    expect(cardDiv!.contains(stampEl)).toBe(true);
  });

  it("changing title triggers notesService.patch after debounce with only the title field", () => {
    const updatedNote = {
      ...note,
      title: "New Title",
      updated_at: "2024-07-22T10:00:00.000Z",
    };
    vi.mocked(notesService.patch).mockResolvedValue(updatedNote);

    render(<NoteEditor note={note} />);
    const titleInput = screen.getByDisplayValue("Test Title");

    fireEvent.change(titleInput, { target: { value: "New Title" } });

    // Should not call immediately
    expect(notesService.patch).not.toHaveBeenCalled();

    // Advance past debounce
    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(notesService.patch).toHaveBeenCalledWith(note.id, {
      title: "New Title",
    });
    expect(notesService.patch).toHaveBeenCalledTimes(1);
  });

  it("changing body triggers notesService.patch after debounce with only the body field", () => {
    const updatedNote = {
      ...note,
      body: "New body",
      updated_at: "2024-07-22T10:00:00.000Z",
    };
    vi.mocked(notesService.patch).mockResolvedValue(updatedNote);

    render(<NoteEditor note={note} />);
    const bodyTextarea = screen.getByDisplayValue("Test body content");

    fireEvent.change(bodyTextarea, { target: { value: "New body" } });

    expect(notesService.patch).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(notesService.patch).toHaveBeenCalledWith(note.id, {
      body: "New body",
    });
    expect(notesService.patch).toHaveBeenCalledTimes(1);
  });

  it("changing category triggers notesService.patch and updates background color immediately", () => {
    const updatedNote = {
      ...note,
      category: "school",
      updated_at: "2024-07-22T10:00:00.000Z",
    };
    vi.mocked(notesService.patch).mockResolvedValue(updatedNote);

    const { container } = render(<NoteEditor note={note} />);

    // Initially personal background
    const noteArea = container.querySelector(".bg-note-personal");
    expect(noteArea).not.toBeNull();

    // Open dropdown and select "School"
    fireEvent.click(screen.getByRole("button", { expanded: false }));
    fireEvent.click(screen.getByRole("option", { name: "School" }));

    // Background should update immediately (before debounce)
    const schoolArea = container.querySelector(".bg-note-school");
    expect(schoolArea).not.toBeNull();

    // Advance past debounce
    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(notesService.patch).toHaveBeenCalledWith(note.id, {
      category: "school",
    });
  });

  it("debounce resets on rapid typing — only the last value is saved", () => {
    const updatedNote = {
      ...note,
      title: "Final",
      updated_at: "2024-07-22T10:00:00.000Z",
    };
    vi.mocked(notesService.patch).mockResolvedValue(updatedNote);

    render(<NoteEditor note={note} />);
    const titleInput = screen.getByDisplayValue("Test Title");

    // Type twice quickly (within debounce window)
    fireEvent.change(titleInput, { target: { value: "First" } });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    fireEvent.change(titleInput, { target: { value: "Final" } });

    act(() => {
      vi.advanceTimersByTime(400);
    });

    // Only "Final" should be saved, not "First"
    expect(notesService.patch).toHaveBeenCalledTimes(1);
    expect(notesService.patch).toHaveBeenCalledWith(note.id, {
      title: "Final",
    });
  });

  it("X button clears pending timer and navigates to /notes", () => {
    vi.mocked(notesService.patch).mockResolvedValue(note);

    render(<NoteEditor note={note} />);

    // Type to start a debounce timer
    fireEvent.change(screen.getByDisplayValue("Test Title"), {
      target: { value: "Unsaved" },
    });

    // Close before debounce fires
    fireEvent.click(screen.getByRole("button", { name: "Close editor" }));
    expect(mockPush).toHaveBeenCalledWith("/notes");

    // Advance past debounce — patch should NOT have been called
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(notesService.patch).not.toHaveBeenCalled();
  });

  it("X button navigates to /notes", () => {
    render(<NoteEditor note={note} />);
    fireEvent.click(screen.getByRole("button", { name: "Close editor" }));
    expect(mockPush).toHaveBeenCalledWith("/notes");
  });

  it("falls back to bg-cream and border-brand for unknown categories", () => {
    const unknownNote = mockNote({
      title: "Unknown Cat",
      body: "Body",
      category: "unknown_category",
      updated_at: "2024-07-21T20:39:00.000Z",
    });
    const { container } = render(<NoteEditor note={unknownNote} />);
    const noteArea = container.querySelector(".bg-cream.border-brand");
    expect(noteArea).not.toBeNull();
  });
});
