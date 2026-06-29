/**
 * Category color mappings extracted from Figma node 12-486.
 * Background colors use Tailwind tokens defined in tailwind.config.ts.
 */

/** Tailwind background class for each note category. */
export const CATEGORY_COLORS: Record<string, string> = {
  random_thoughts: "bg-note-random",
  school: "bg-note-school",
  personal: "bg-note-personal",
};

/** Tailwind border class for each note category card. */
export const CATEGORY_BORDER_COLORS: Record<string, string> = {
  random_thoughts: "border-border-random",
  school: "border-border-school",
  personal: "border-border-personal",
};

/** Tailwind background class for each category dot indicator. */
export const CATEGORY_DOT_COLORS: Record<string, string> = {
  random_thoughts: "bg-dot-random",
  school: "bg-dot-school",
  personal: "bg-dot-personal",
};

/** Human-readable display names for each category value. */
export const CATEGORY_LABELS: Record<string, string> = {
  random_thoughts: "Random Thoughts",
  school: "School",
  personal: "Personal",
};

/** Ordered list of all category keys for rendering in a consistent order. */
export const CATEGORY_KEYS = ["random_thoughts", "school", "personal"] as const;
