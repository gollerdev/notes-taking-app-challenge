import { describe, it, expect, vi, afterEach } from "vitest";
import { formatRelativeDate } from "./relativeDate";

describe("formatRelativeDate", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "today" for a date on the same calendar day', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-29T15:00:00Z"));

    expect(formatRelativeDate("2026-06-29T08:00:00Z")).toBe("today");
    expect(formatRelativeDate("2026-06-29T23:59:59Z")).toBe("today");
  });

  it('returns "yesterday" for a date on the previous calendar day', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-29T15:00:00Z"));

    expect(formatRelativeDate("2026-06-28T08:00:00Z")).toBe("yesterday");
    expect(formatRelativeDate("2026-06-28T23:59:59Z")).toBe("yesterday");
  });

  it("returns an absolute date string for older dates", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-29T15:00:00Z"));

    const result = formatRelativeDate("2026-06-15T10:00:00Z");
    expect(result).toBe("Jun 15");
  });

  it("returns an absolute date string for dates from a different year", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-29T15:00:00Z"));

    const result = formatRelativeDate("2025-12-25T10:00:00Z");
    expect(result).toBe("Dec 25");
  });
});
