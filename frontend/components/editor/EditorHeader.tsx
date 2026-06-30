"use client";

import { CategoryDropdown } from "./CategoryDropdown";

interface EditorHeaderProps {
  category: string;
  onCategoryChange: (category: string) => void;
  onClose: () => void;
}

/** Editor header bar with category dropdown and X close button per Figma node 2:8568. */
export function EditorHeader({
  category,
  onCategoryChange,
  onClose,
}: EditorHeaderProps) {
  return (
    <div className="flex w-full items-start justify-between">
      <CategoryDropdown value={category} onChange={onCategoryChange} />
      <button
        type="button"
        onClick={onClose}
        aria-label="Close editor"
        className="cursor-pointer text-brand hover:text-heading"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
