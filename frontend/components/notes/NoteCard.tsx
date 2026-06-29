"use client";

import {
  CATEGORY_COLORS,
  CATEGORY_BORDER_COLORS,
  CATEGORY_LABELS,
} from "@/lib/categoryColors";
import { formatRelativeDate } from "@/lib/relativeDate";
import type { Note } from "@/types";

interface NoteCardProps {
  note: Note;
}

/** Renders a single note card with category-colored background per Figma node 2:39. */
export function NoteCard({ note }: NoteCardProps) {
  const bgColor = CATEGORY_COLORS[note.category] ?? "bg-cream";
  const borderColor = CATEGORY_BORDER_COLORS[note.category] ?? "border-brand";
  const categoryLabel = CATEGORY_LABELS[note.category] ?? note.category;
  const relativeDate = formatRelativeDate(note.created_at);

  return (
    <div
      className={`flex h-[246px] w-full flex-col gap-3 rounded-[11px] border-[3px] p-4 shadow-[1px_1px_2px_0px_rgba(0,0,0,0.25)] ${bgColor} ${borderColor}`}
    >
      <div className="flex gap-2 text-xs font-sans text-black">
        <span className="font-bold">{relativeDate}</span>
        <span className="font-normal">{categoryLabel}</span>
      </div>
      <h3 className="font-serif text-2xl font-bold leading-normal text-black">
        {note.title}
      </h3>
      <p className="flex-1 overflow-hidden font-sans text-xs font-normal leading-normal text-black line-clamp-6">
        {note.body}
      </p>
    </div>
  );
}
