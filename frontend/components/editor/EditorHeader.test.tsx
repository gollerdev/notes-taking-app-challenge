import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EditorHeader } from "./EditorHeader";

describe("EditorHeader", () => {
  const defaultProps = {
    category: "personal",
    onCategoryChange: vi.fn(),
    onClose: vi.fn(),
  };

  it("renders category dropdown with the current category", () => {
    render(<EditorHeader {...defaultProps} />);
    expect(screen.getByText("Personal")).toBeInTheDocument();
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
});
