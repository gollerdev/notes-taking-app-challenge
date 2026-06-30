import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NewNoteButton } from "./NewNoteButton";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe("NewNoteButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the button text", () => {
    render(<NewNoteButton />);
    expect(screen.getByText("New Note")).toBeInTheDocument();
    expect(screen.getByText("+")).toBeInTheDocument();
  });

  it("navigates to /notes/new when clicked with no category", () => {
    render(<NewNoteButton />);
    fireEvent.click(screen.getByRole("button"));
    expect(mockPush).toHaveBeenCalledWith("/notes/new");
    expect(mockPush).toHaveBeenCalledTimes(1);
  });

  it("navigates with category query param when category is set", () => {
    render(<NewNoteButton category="school" />);
    fireEvent.click(screen.getByRole("button"));
    expect(mockPush).toHaveBeenCalledWith("/notes/new?category=school");
    expect(mockPush).toHaveBeenCalledTimes(1);
  });

  it("navigates to /notes/new when category is null", () => {
    render(<NewNoteButton category={null} />);
    fireEvent.click(screen.getByRole("button"));
    expect(mockPush).toHaveBeenCalledWith("/notes/new");
    expect(mockPush).toHaveBeenCalledTimes(1);
  });
});
