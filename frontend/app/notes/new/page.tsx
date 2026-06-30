"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { notesService } from "@/services/notes";

const DEFAULT_CATEGORY = "personal";

/** Transient page: creates a blank note and redirects to its editor. */
export default function NewNotePage() {
  const { isAuthenticated, isHydrated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const category = searchParams.get("category") || DEFAULT_CATEGORY;
  // Guards against React StrictMode running the effect twice in dev, which
  // would otherwise create two notes per visit.
  const hasCreated = useRef(false);

  useEffect(() => {
    if (!isHydrated) return;

    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (hasCreated.current) {
      return;
    }
    hasCreated.current = true;

    void notesService
      .create({ title: "Untitled", body: "", category })
      .then((newNote) => {
        router.replace(`/notes/${newNote.id}`);
      });
  }, [isAuthenticated, isHydrated, router, category]);

  if (!isHydrated || !isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream">
      <p className="font-sans text-lg text-heading">Creating note...</p>
    </div>
  );
}
