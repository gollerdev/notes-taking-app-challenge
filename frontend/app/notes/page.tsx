"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useNotes } from "@/hooks/useNotes";
import { CategorySidebar } from "@/components/notes/CategorySidebar";
import { NoteGrid } from "@/components/notes/NoteGrid";
import { NewNoteButton } from "@/components/notes/NewNoteButton";

/** Notes main screen — protected route at /notes. */
export default function NotesPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const { notes, loading, error } = useNotes();
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <p className="font-sans text-lg text-heading">Loading notes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <p className="font-sans text-lg text-red-600">
          Failed to load notes. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-cream">
      {/* Top-right New Note button — positioned per Figma at top-right */}
      <div className="absolute right-[34px] top-[39px] flex items-center gap-3">
        <NewNoteButton />
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
