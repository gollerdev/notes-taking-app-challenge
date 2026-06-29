import { api } from "@/lib/api";
import type { Note, CreateNotePayload } from "@/types";

/** Notes service — calls backend notes endpoints via lib/api. */
export const notesService = {
  /** Fetch all notes for the authenticated user. */
  async getAll(): Promise<Note[]> {
    return api.get<Note[]>("/notes/");
  },

  /** Create a new note with the given payload. */
  async create(payload: CreateNotePayload): Promise<Note> {
    return api.post<Note>("/notes/", payload);
  },
};
