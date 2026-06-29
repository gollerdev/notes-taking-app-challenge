import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NoteGrid } from "./NoteGrid";
import { mockNote } from "@/test-utils/factories";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe("NoteGrid", () => {
  it("renders a NoteCard for each note", () => {
    const notes = [
      mockNote({ title: "Note One" }),
      mockNote({ title: "Note Two" }),
      mockNote({ title: "Note Three" }),
    ];
    render(<NoteGrid notes={notes} />);
    expect(screen.getByText("Note One")).toBeInTheDocument();
    expect(screen.getByText("Note Two")).toBeInTheDocument();
    expect(screen.getByText("Note Three")).toBeInTheDocument();
  });

  it("renders EmptyState when notes array is empty", () => {
    render(<NoteGrid notes={[]} />);
    expect(
      screen.getByText("I'm just here waiting for your charming notes..."),
    ).toBeInTheDocument();
    expect(screen.getByAltText("No notes illustration")).toBeInTheDocument();
  });
});
