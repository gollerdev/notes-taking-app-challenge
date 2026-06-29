"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { notesService } from "@/services/notes";
import { NoteEditor } from "@/components/editor/NoteEditor";
import type { Note } from "@/types";

/** Editor shell page — fetches note by ID and renders NoteEditor. Protected route. */
export default function NoteEditorPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    notesService
      .getById(params.id)
      .then(setNote)
      .catch(() => {
        // note stays null, which triggers the "not found" state
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated, router, params.id]);

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <p className="font-sans text-lg text-heading">Loading note...</p>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <p className="font-sans text-lg text-red-600">Note not found.</p>
      </div>
    );
  }

  return <NoteEditor note={note} />;
}
