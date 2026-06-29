import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CategoryDropdown } from "./CategoryDropdown";

describe("CategoryDropdown", () => {
  it("renders colored dot and category label for the current value", () => {
    render(<CategoryDropdown value="personal" onChange={vi.fn()} />);
    expect(screen.getByText("Personal")).toBeInTheDocument();
    // The dot element should have the personal dot color class
    const button = screen.getByRole("button", { expanded: false });
    const dot = button.querySelector("span");
    expect(dot?.className).toContain("bg-dot-personal");
  });

  it("renders the correct label for random_thoughts", () => {
    render(<CategoryDropdown value="random_thoughts" onChange={vi.fn()} />);
    expect(screen.getByText("Random Thoughts")).toBeInTheDocument();
  });

  it("renders the correct label for school", () => {
    render(<CategoryDropdown value="school" onChange={vi.fn()} />);
    expect(screen.getByText("School")).toBeInTheDocument();
  });

  it("clicking toggles open state showing all three category options", () => {
    render(<CategoryDropdown value="personal" onChange={vi.fn()} />);

    // Dropdown should be closed initially
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

    // Click to open
    fireEvent.click(screen.getByRole("button", { expanded: false }));

    // All three options should appear
    const listbox = screen.getByRole("listbox");
    expect(listbox).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Random Thoughts" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "School" })).toBeInTheDocument();
    // "Personal" appears both in the trigger and in the list
    const personalOptions = screen.getAllByText("Personal");
    expect(personalOptions.length).toBeGreaterThanOrEqual(2);
  });

  it("selecting a new category calls onChange with the correct value", () => {
    const onChange = vi.fn();
    render(<CategoryDropdown value="personal" onChange={onChange} />);

    // Open dropdown
    fireEvent.click(screen.getByRole("button", { expanded: false }));

    // Select "School"
    fireEvent.click(screen.getByRole("option", { name: "School" }));

    expect(onChange).toHaveBeenCalledWith("school");
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("dropdown closes after selection", () => {
    render(<CategoryDropdown value="personal" onChange={vi.fn()} />);

    // Open
    fireEvent.click(screen.getByRole("button", { expanded: false }));
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    // Select an option
    fireEvent.click(screen.getByRole("option", { name: "Random Thoughts" }));

    // Dropdown should be closed
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("closes when clicking outside", () => {
    render(<CategoryDropdown value="personal" onChange={vi.fn()} />);

    // Open
    fireEvent.click(screen.getByRole("button", { expanded: false }));
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    // Click outside
    fireEvent.mouseDown(document.body);

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("falls back to bg-brand and raw value for unknown categories", () => {
    render(<CategoryDropdown value="unknown_cat" onChange={vi.fn()} />);
    // Should display the raw value as label
    expect(screen.getByText("unknown_cat")).toBeInTheDocument();
    // Dot should use fallback color
    const button = screen.getByRole("button", { expanded: false });
    const dot = button.querySelector("span");
    expect(dot?.className).toContain("bg-brand");
  });
});
