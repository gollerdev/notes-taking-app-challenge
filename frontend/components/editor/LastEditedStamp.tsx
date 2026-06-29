"use client";

interface LastEditedStampProps {
  updatedAt: string;
}

/**
 * Formats an ISO date string as an absolute timestamp per Figma node 12:261.
 *
 * Format: "July 21, 2024 at 8:39pm"
 * - Full month name, day, year
 * - "at" separator
 * - 12-hour time with lowercase am/pm, no leading zero on hour
 */
function formatLastEdited(isoString: string): string {
  const date = new Date(isoString);
  const month = date.toLocaleDateString("en-US", { month: "long" });
  const day = date.getDate();
  const year = date.getFullYear();
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "pm" : "am";
  hours = hours % 12 || 12;
  const minuteStr = minutes === 0 ? "" : `:${String(minutes).padStart(2, "0")}`;
  return `${month} ${day}, ${year} at ${hours}${minuteStr}${ampm}`;
}

/** Displays "Last Edited: <formatted date>" per Figma. */
export function LastEditedStamp({ updatedAt }: LastEditedStampProps) {
  return (
    <p className="font-sans text-xs font-normal leading-normal text-black text-right">
      Last Edited: {formatLastEdited(updatedAt)}
    </p>
  );
}

export { formatLastEdited };
