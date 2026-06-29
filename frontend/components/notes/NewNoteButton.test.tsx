import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NewNoteButton } from "./NewNoteButton";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe("NewNoteButton", () => {
  it("renders the button text", () => {
    render(<NewNoteButton />);
    expect(screen.getByText("New Note")).toBeInTheDocument();
    expect(screen.getByText("+")).toBeInTheDocument();
  });

  it("navigates to /notes/new when clicked", () => {
    render(<NewNoteButton />);
    fireEvent.click(screen.getByRole("button"));
    expect(mockPush).toHaveBeenCalledWith("/notes/new");
    expect(mockPush).toHaveBeenCalledTimes(1);
  });
});
