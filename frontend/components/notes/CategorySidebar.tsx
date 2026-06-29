"use client";

import { CategoryItem } from "./CategoryItem";
import { CATEGORY_KEYS, CATEGORY_LABELS } from "@/lib/categoryColors";
import type { Note } from "@/types";

interface CategorySidebarProps {
  notes: Note[];
  activeCategory: string | null;
  onSelect: (category: string | null) => void;
}

/** Sidebar listing all categories with note counts. */
export function CategorySidebar({
  notes,
  activeCategory,
  onSelect,
}: CategorySidebarProps) {
  return (
    <nav className="flex w-[256px] flex-col items-start">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className="flex h-8 w-full cursor-pointer items-center px-4 text-left font-sans text-xs font-bold text-black"
      >
        All Categories
      </button>
      {CATEGORY_KEYS.map((key) => {
        const count = notes.filter((n) => n.category === key).length;
        return (
          <CategoryItem
            key={key}
            label={CATEGORY_LABELS[key]}
            categoryKey={key}
            count={count}
            isActive={activeCategory === key}
            onClick={() => onSelect(key)}
          />
        );
      })}
    </nav>
  );
}
