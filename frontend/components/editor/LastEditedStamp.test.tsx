import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LastEditedStamp, formatLastEdited } from "./LastEditedStamp";

describe("formatLastEdited", () => {
  it('formats an ISO string as "July 21, 2024 at 8:39pm"', () => {
    // 8:39 PM UTC = we test with a specific timezone-safe approach
    const result = formatLastEdited("2024-07-21T20:39:00.000Z");
    // The exact output depends on the local timezone of the test runner,
    // but we can verify the format pattern
    expect(result).toMatch(/^[A-Z][a-z]+ \d{1,2}, \d{4} at \d{1,2}(:\d{2})?(am|pm)$/);
  });

  it("formats midnight correctly without minutes", () => {
    const result = formatLastEdited("2024-01-15T05:00:00.000Z");
    // Should not show ":00" for on-the-hour times
    expect(result).toMatch(/^[A-Z][a-z]+ \d{1,2}, \d{4} at \d{1,2}(am|pm)$/);
  });

  it("formats a time with minutes", () => {
    const result = formatLastEdited("2024-03-10T14:05:00.000Z");
    expect(result).toMatch(/^[A-Z][a-z]+ \d{1,2}, \d{4} at \d{1,2}:\d{2}(am|pm)$/);
  });

  it("formats noon correctly (12pm, not 0pm)", () => {
    // Create a date at exactly noon local time
    const noon = new Date(2024, 5, 15, 12, 0, 0);
    const result = formatLastEdited(noon.toISOString());
    expect(result).toBe("June 15, 2024 at 12pm");
  });

  it("formats midnight correctly (12am, not 0am)", () => {
    // Create a date at exactly midnight local time
    const midnight = new Date(2024, 5, 15, 0, 0, 0);
    const result = formatLastEdited(midnight.toISOString());
    expect(result).toBe("June 15, 2024 at 12am");
  });
});

describe("LastEditedStamp", () => {
  it('displays "Last Edited:" with the formatted date', () => {
    render(<LastEditedStamp updatedAt="2024-07-21T20:39:00.000Z" />);
    const text = screen.getByText(/Last Edited:/);
    expect(text).toBeInTheDocument();
  });

  it("updates when updatedAt prop changes", () => {
    const { rerender } = render(
      <LastEditedStamp updatedAt="2024-07-21T20:39:00.000Z" />,
    );
    const firstText = screen.getByText(/Last Edited:/).textContent;

    rerender(<LastEditedStamp updatedAt="2025-01-01T12:00:00.000Z" />);
    const secondText = screen.getByText(/Last Edited:/).textContent;

    expect(firstText).not.toBe(secondText);
  });
});
