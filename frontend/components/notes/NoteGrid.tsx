"use client";

import { NoteCard } from "./NoteCard";
import { EmptyState } from "./EmptyState";
import type { Note } from "@/types";

interface NoteGridProps {
  notes: Note[];
}

/** 3-column grid of note cards; shows EmptyState when list is empty. */
export function NoteGrid({ notes }: NoteGridProps) {
  if (notes.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid grid-cols-3 gap-x-[13px] gap-y-[16px]">
      {notes.map((note) => (
        <NoteCard key={note.id} note={note} />
      ))}
    </div>
  );
}
