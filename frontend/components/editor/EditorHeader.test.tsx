import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EditorHeader } from "./EditorHeader";

describe("EditorHeader", () => {
  const defaultProps = {
    category: "personal",
    lastEdited: "2024-07-21T20:39:00.000Z",
    onCategoryChange: vi.fn(),
    onClose: vi.fn(),
  };

  it("renders category dropdown with the current category", () => {
    render(<EditorHeader {...defaultProps} />);
    expect(screen.getByText("Personal")).toBeInTheDocument();
  });

  it('renders "Last Edited" timestamp', () => {
    render(<EditorHeader {...defaultProps} />);
    expect(screen.getByText(/Last Edited:/)).toBeInTheDocument();
  });

  it("renders the X close button", () => {
    render(<EditorHeader {...defaultProps} />);
    expect(screen.getByRole("button", { name: "Close editor" })).toBeInTheDocument();
  });

  it("X button calls onClose when clicked", () => {
    const onClose = vi.fn();
    render(<EditorHeader {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "Close editor" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("displays the correct absolute date format", () => {
    render(<EditorHeader {...defaultProps} />);
    const stampText = screen.getByText(/Last Edited:/).textContent;
    // Should contain "at" separator and am/pm
    expect(stampText).toMatch(/at \d{1,2}/);
    expect(stampText).toMatch(/(am|pm)/);
  });
});
