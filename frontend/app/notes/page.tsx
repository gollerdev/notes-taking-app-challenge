"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useNotes } from "@/hooks/useNotes";
import { notesService } from "@/services/notes";
import { CategorySidebar } from "@/components/notes/CategorySidebar";
import { NoteGrid } from "@/components/notes/NoteGrid";
import { NewNoteButton } from "@/components/notes/NewNoteButton";

/** Notes main screen — protected route at /notes. */
export default function NotesPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const { notes, loading, setNotes } = useNotes();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  const filtered = activeCategory
    ? notes.filter((n) => n.category === activeCategory)
    : notes;

  const handleNewNote = () => {
    void notesService
      .create({
        title: "Untitled",
        body: "",
        category: activeCategory ?? "random_thoughts",
      })
      .then((newNote) => {
        setNotes((prev) => [newNote, ...prev]);
      });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <p className="font-sans text-lg text-heading">Loading notes...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-cream">
      {/* Top-right New Note button — positioned per Figma at top-right */}
      <div className="absolute right-[34px] top-[39px]">
        <NewNoteButton onClick={handleNewNote} />
      </div>

      {/* Sidebar + Content layout */}
      <div className="flex">
        <div className="w-[311px] shrink-0 pl-[23px] pt-[101px]">
          <CategorySidebar
            notes={notes}
            activeCategory={activeCategory}
            onSelect={setActiveCategory}
          />
        </div>
        <main className="flex-1 pr-[34px] pt-[101px]">
          <NoteGrid notes={filtered} />
        </main>
      </div>
    </div>
  );
}
