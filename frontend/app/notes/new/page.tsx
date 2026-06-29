"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { notesService } from "@/services/notes";

/** Transient page: creates a blank note and redirects to its editor. */
export default function NewNotePage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    void notesService
      .create({ title: "Untitled", body: "", category: "personal" })
      .then((newNote) => {
        router.replace(`/notes/${newNote.id}`);
      });
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream">
      <p className="font-sans text-lg text-heading">Creating note...</p>
    </div>
  );
}
