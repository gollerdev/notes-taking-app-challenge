import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NewNoteButton } from "./NewNoteButton";

describe("NewNoteButton", () => {
  it("renders the button text", () => {
    render(<NewNoteButton onClick={vi.fn()} />);
    expect(screen.getByText("New Note")).toBeInTheDocument();
    expect(screen.getByText("+")).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    render(<NewNoteButton onClick={onClick} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
