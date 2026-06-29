import { useState, useEffect } from "react";
import { notesService } from "@/services/notes";
import type { Note } from "@/types";

/**
 * Custom hook that fetches all notes on mount.
 *
 * Returns the notes array, loading state, and a setNotes function
 * so the page can optimistically add new notes.
 */
export function useNotes(): {
  notes: Note[];
  loading: boolean;
  error: boolean;
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
} {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    notesService
      .getAll()
      .then(setNotes)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return { notes, loading, error, setNotes };
}
