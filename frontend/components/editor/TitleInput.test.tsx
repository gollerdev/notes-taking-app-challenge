import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TitleInput } from "./TitleInput";

describe("TitleInput", () => {
  it('renders with correct placeholder text "Note Title"', () => {
    render(<TitleInput value="" onChange={vi.fn()} />);
    expect(screen.getByPlaceholderText("Note Title")).toBeInTheDocument();
  });

  it("renders with the provided value", () => {
    render(<TitleInput value="My Note" onChange={vi.fn()} />);
    expect(screen.getByDisplayValue("My Note")).toBeInTheDocument();
  });

  it("calls onChange on every keystroke", () => {
    const onChange = vi.fn();
    render(<TitleInput value="" onChange={onChange} />);
    const input = screen.getByPlaceholderText("Note Title");
    fireEvent.change(input, { target: { value: "H" } });
    expect(onChange).toHaveBeenCalledWith("H");
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
