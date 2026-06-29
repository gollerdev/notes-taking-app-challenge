"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { notesService } from "@/services/notes";
import { CATEGORY_COLORS, CATEGORY_BORDER_COLORS } from "@/lib/categoryColors";
import { EditorHeader } from "./EditorHeader";
import { TitleInput } from "./TitleInput";
import { BodyTextarea } from "./BodyTextarea";
import type { Note, CreateNotePayload } from "@/types";

interface NoteEditorProps {
  note: Note;
}

/** Full-screen note editor with autosave per Figma node 2:8568. */
export function NoteEditor({ note }: NoteEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(note.title);
  const [body, setBody] = useState(note.body);
  const [category, setCategory] = useState(note.category);
  const [lastEdited, setLastEdited] = useState(note.updated_at);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(
    (patch: Partial<CreateNotePayload>) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        void notesService.patch(note.id, patch).then((updated) => {
          setLastEdited(updated.updated_at);
        });
      }, 400);
    },
    [note.id],
  );

  const handleTitleChange = useCallback(
    (newTitle: string) => {
      setTitle(newTitle);
      save({ title: newTitle });
    },
    [save],
  );

  const handleBodyChange = useCallback(
    (newBody: string) => {
      setBody(newBody);
      save({ body: newBody });
    },
    [save],
  );

  const handleCategoryChange = useCallback(
    (newCategory: string) => {
      setCategory(newCategory);
      save({ category: newCategory });
    },
    [save],
  );

  const handleClose = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    router.push("/notes");
  }, [router]);

  const bgColor = CATEGORY_COLORS[category] ?? "bg-cream";
  const borderColor = CATEGORY_BORDER_COLORS[category] ?? "border-brand";

  return (
    <div className="min-h-screen bg-cream">
      <div className="px-[37px] pt-[33px]">
        <EditorHeader
          category={category}
          lastEdited={lastEdited}
          onCategoryChange={handleCategoryChange}
          onClose={handleClose}
        />
      </div>
      <div
        className={`mx-[37px] mt-[11px] flex flex-col gap-6 rounded-[11px] border-[3px] px-16 pb-16 pt-[39px] shadow-[1px_1px_2px_0px_rgba(0,0,0,0.25)] ${bgColor} ${borderColor}`}
        style={{ minHeight: "700px" }}
      >
        <TitleInput value={title} onChange={handleTitleChange} />
        <BodyTextarea value={body} onChange={handleBodyChange} />
      </div>
    </div>
  );
}
