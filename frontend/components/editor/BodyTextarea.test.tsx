import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BodyTextarea } from "./BodyTextarea";

describe("BodyTextarea", () => {
  it('renders with correct placeholder text "Pour your heart out..."', () => {
    render(<BodyTextarea value="" onChange={vi.fn()} />);
    expect(screen.getByPlaceholderText("Pour your heart out...")).toBeInTheDocument();
  });

  it("renders with the provided value", () => {
    render(<BodyTextarea value="Some body text" onChange={vi.fn()} />);
    expect(screen.getByDisplayValue("Some body text")).toBeInTheDocument();
  });

  it("calls onChange on every keystroke", () => {
    const onChange = vi.fn();
    render(<BodyTextarea value="" onChange={onChange} />);
    const textarea = screen.getByPlaceholderText("Pour your heart out...");
    fireEvent.change(textarea, { target: { value: "Hello" } });
    expect(onChange).toHaveBeenCalledWith("Hello");
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
