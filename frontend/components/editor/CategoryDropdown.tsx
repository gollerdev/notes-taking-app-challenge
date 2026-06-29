"use client";

import { useState, useRef, useEffect } from "react";
import {
  CATEGORY_DOT_COLORS,
  CATEGORY_LABELS,
  CATEGORY_KEYS,
} from "@/lib/categoryColors";

interface CategoryDropdownProps {
  value: string;
  onChange: (category: string) => void;
}

/** Category dropdown with colored dot + label per Figma node 6:16907 / 6:16918. */
export function CategoryDropdown({ value, onChange }: CategoryDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const dotColor = CATEGORY_DOT_COLORS[value] ?? "bg-brand";
  const label = CATEGORY_LABELS[value] ?? value;

  return (
    <div ref={dropdownRef} className="relative w-[225px]">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex h-[39px] w-full cursor-pointer items-center gap-2 rounded-[6px] border border-brand px-[15px] py-[7px]"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className={`h-[11px] w-[11px] shrink-0 rounded-full ${dotColor}`} />
        <span className="flex-1 text-left font-sans text-xs font-normal text-black">
          {label}
        </span>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          className={`shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
        >
          <path
            d="M6 9L12 15L18 9"
            stroke="#957139"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="absolute left-0 top-[46px] z-10 flex w-[225px] flex-col items-start rounded-lg bg-cream"
        >
          {CATEGORY_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              role="option"
              aria-selected={key === value}
              onClick={() => {
                onChange(key);
                setIsOpen(false);
              }}
              className="flex h-[32px] w-[225px] cursor-pointer items-center gap-2 p-4 hover:bg-black/5"
            >
              <span
                className={`h-[11px] w-[11px] shrink-0 rounded-full ${CATEGORY_DOT_COLORS[key]}`}
              />
              <span className="flex-1 text-left font-sans text-xs font-normal text-black">
                {CATEGORY_LABELS[key]}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
