import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CategorySidebar } from "./CategorySidebar";
import { mockNote } from "@/test-utils/factories";

describe("CategorySidebar", () => {
  const notes = [
    mockNote({ category: "random_thoughts" }),
    mockNote({ category: "random_thoughts" }),
    mockNote({ category: "school" }),
    mockNote({ category: "personal" }),
    mockNote({ category: "personal" }),
    mockNote({ category: "personal" }),
  ];

  it('renders "All Categories" heading', () => {
    render(<CategorySidebar notes={notes} activeCategory={null} onSelect={vi.fn()} />);
    expect(screen.getByText("All Categories")).toBeInTheDocument();
  });

  it("renders each category with the correct note count", () => {
    render(<CategorySidebar notes={notes} activeCategory={null} onSelect={vi.fn()} />);
    expect(screen.getByText("Random Thoughts")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();

    expect(screen.getByText("School")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();

    expect(screen.getByText("Personal")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("calls onSelect with the correct category value when clicked", () => {
    const onSelect = vi.fn();
    render(<CategorySidebar notes={notes} activeCategory={null} onSelect={onSelect} />);
    fireEvent.click(screen.getByText("School"));
    expect(onSelect).toHaveBeenCalledWith("school");
  });

  it('calls onSelect with null when "All Categories" is clicked', () => {
    const onSelect = vi.fn();
    render(
      <CategorySidebar notes={notes} activeCategory="school" onSelect={onSelect} />,
    );
    fireEvent.click(screen.getByText("All Categories"));
    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it("marks the active category as visually distinguished", () => {
    render(
      <CategorySidebar notes={notes} activeCategory="school" onSelect={vi.fn()} />,
    );
    // The School button should have active styling
    const schoolButton = screen.getByText("School").closest("button");
    expect(schoolButton?.className).toContain("font-bold");
  });

  it('"All Categories" heading is always bold regardless of active state', () => {
    render(
      <CategorySidebar notes={notes} activeCategory="school" onSelect={vi.fn()} />,
    );
    const allCategoriesButton = screen.getByText("All Categories").closest("button");
    expect(allCategoriesButton?.className).toContain("font-bold");
  });
});
