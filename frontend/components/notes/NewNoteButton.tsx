"use client";

import { useRouter } from "next/navigation";

/** "+ New Note" CTA button per Figma — navigates to /notes/new on click. */
export function NewNoteButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push("/notes/new")}
      className="flex h-[43px] w-[133px] cursor-pointer items-center justify-center gap-[6px] rounded-[46px] border border-brand px-4 py-3 font-sans text-base font-bold text-brand hover:bg-brand hover:text-cream transition-colors"
    >
      <span className="text-lg leading-none">+</span>
      <span>New Note</span>
    </button>
  );
}
