import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CategoryItem } from "./CategoryItem";

describe("CategoryItem", () => {
  it("renders the category label", () => {
    render(
      <CategoryItem
        label="Random Thoughts"
        categoryKey="random_thoughts"
        count={3}
        isActive={false}
        onClick={vi.fn()}
      />,
    );
    expect(screen.getByText("Random Thoughts")).toBeInTheDocument();
  });

  it("renders the note count", () => {
    render(
      <CategoryItem
        label="School"
        categoryKey="school"
        count={5}
        isActive={false}
        onClick={vi.fn()}
      />,
    );
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    render(
      <CategoryItem
        label="Personal"
        categoryKey="personal"
        count={2}
        isActive={false}
        onClick={onClick}
      />,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("applies active styling when isActive is true", () => {
    render(
      <CategoryItem
        label="School"
        categoryKey="school"
        count={1}
        isActive={true}
        onClick={vi.fn()}
      />,
    );
    const button = screen.getByRole("button");
    expect(button.className).toContain("font-bold");
  });

  it("applies inactive styling when isActive is false", () => {
    render(
      <CategoryItem
        label="School"
        categoryKey="school"
        count={1}
        isActive={false}
        onClick={vi.fn()}
      />,
    );
    const button = screen.getByRole("button");
    expect(button.className).toContain("font-normal");
  });

  it("falls back to bg-gray-400 for an unknown category key", () => {
    const { container } = render(
      <CategoryItem
        label="Unknown"
        categoryKey="unknown_category"
        count={0}
        isActive={false}
        onClick={vi.fn()}
      />,
    );
    const dot = container.querySelector("span.rounded-full");
    expect(dot?.className).toContain("bg-gray-400");
  });
});
