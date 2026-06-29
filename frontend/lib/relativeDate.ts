/**
 * Formats an ISO date string as a relative date label.
 *
 * - Same calendar day as now -> "today"
 * - Previous calendar day   -> "yesterday"
 * - Older                   -> locale date string without year (e.g. "Jun 15")
 *
 * Uses native Date — no external date library.
 */
export function formatRelativeDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 1,
  );

  if (date >= startOfToday) {
    return "today";
  }
  if (date >= startOfYesterday) {
    return "yesterday";
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
