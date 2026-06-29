import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "./EmptyState";

describe("EmptyState", () => {
  it("renders the empty state illustration", () => {
    render(<EmptyState />);
    const img = screen.getByAltText("No notes illustration");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src");
  });

  it("renders the correct message text", () => {
    render(<EmptyState />);
    expect(
      screen.getByText("I'm just here waiting for your charming notes..."),
    ).toBeInTheDocument();
  });
});
