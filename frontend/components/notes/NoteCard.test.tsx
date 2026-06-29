import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { NoteCard } from "./NoteCard";
import { mockNote } from "@/test-utils/factories";

describe("NoteCard", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the note title", () => {
    const note = mockNote({ title: "My Test Note" });
    render(<NoteCard note={note} />);
    expect(screen.getByText("My Test Note")).toBeInTheDocument();
  });

  it("renders the note body preview", () => {
    const note = mockNote({ body: "This is the note body content." });
    render(<NoteCard note={note} />);
    expect(screen.getByText("This is the note body content.")).toBeInTheDocument();
  });

  it('shows "today" in the header for notes created today', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-29T15:00:00Z"));

    const note = mockNote({
      created_at: "2026-06-29T10:00:00Z",
      category: "personal",
    });
    render(<NoteCard note={note} />);
    expect(screen.getByText("today")).toBeInTheDocument();
    expect(screen.getByText("Personal")).toBeInTheDocument();
  });

  it('shows "yesterday" in the header for notes created yesterday', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-29T15:00:00Z"));

    const note = mockNote({
      created_at: "2026-06-28T10:00:00Z",
      category: "school",
    });
    render(<NoteCard note={note} />);
    expect(screen.getByText("yesterday")).toBeInTheDocument();
    expect(screen.getByText("School")).toBeInTheDocument();
  });

  it("shows an absolute date for older notes", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-29T15:00:00Z"));

    const note = mockNote({
      created_at: "2026-06-15T10:00:00Z",
      category: "random_thoughts",
    });
    render(<NoteCard note={note} />);
    expect(screen.getByText("Jun 15")).toBeInTheDocument();
    expect(screen.getByText("Random Thoughts")).toBeInTheDocument();
  });

  it("applies the correct background and border color classes for each category", () => {
    const noteRandom = mockNote({ category: "random_thoughts" });
    const { container: c1 } = render(<NoteCard note={noteRandom} />);
    expect(c1.firstElementChild?.className).toContain("bg-note-random");
    expect(c1.firstElementChild?.className).toContain("border-border-random");

    const noteSchool = mockNote({ category: "school" });
    const { container: c2 } = render(<NoteCard note={noteSchool} />);
    expect(c2.firstElementChild?.className).toContain("bg-note-school");
    expect(c2.firstElementChild?.className).toContain("border-border-school");

    const notePersonal = mockNote({ category: "personal" });
    const { container: c3 } = render(<NoteCard note={notePersonal} />);
    expect(c3.firstElementChild?.className).toContain("bg-note-personal");
    expect(c3.firstElementChild?.className).toContain("border-border-personal");
  });

  it("falls back to bg-cream and border-brand for unknown categories", () => {
    const note = mockNote({ category: "unknown_cat" });
    const { container } = render(<NoteCard note={note} />);
    expect(container.firstElementChild?.className).toContain("bg-cream");
    expect(container.firstElementChild?.className).toContain("border-brand");
    expect(screen.getByText("unknown_cat")).toBeInTheDocument();
  });

  it("renders the date in bold and category label in normal weight", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-29T15:00:00Z"));

    const note = mockNote({
      created_at: "2026-06-29T10:00:00Z",
      category: "personal",
    });
    render(<NoteCard note={note} />);
    const dateEl = screen.getByText("today");
    const catEl = screen.getByText("Personal");
    expect(dateEl.className).toContain("font-bold");
    expect(catEl.className).toContain("font-normal");
  });
});
