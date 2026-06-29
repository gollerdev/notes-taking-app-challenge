"use client";

import { CATEGORY_DOT_COLORS } from "@/lib/categoryColors";

interface CategoryItemProps {
  label: string;
  categoryKey: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
}

/** Single sidebar row: category dot, name, and note count badge. */
export function CategoryItem({
  label,
  categoryKey,
  count,
  isActive,
  onClick,
}: CategoryItemProps) {
  const dotColor = CATEGORY_DOT_COLORS[categoryKey] ?? "bg-gray-400";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-8 w-full cursor-pointer items-center gap-2 px-4 text-left font-sans text-xs ${
        isActive ? "font-bold" : "font-normal"
      }`}
    >
      <span
        className={`inline-block h-[11px] w-[11px] shrink-0 rounded-full ${dotColor}`}
      />
      <span className="flex-1 text-black">{label}</span>
      <span className="text-black">{count}</span>
    </button>
  );
}
