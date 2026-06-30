"use client";

import { useRouter } from "next/navigation";

interface NewNoteButtonProps {
  category?: string | null;
}

/** "+ New Note" CTA button per Figma — navigates to /notes/new on click. */
export function NewNoteButton({ category }: NewNoteButtonProps) {
  const router = useRouter();

  const href = category ? `/notes/new?category=${category}` : "/notes/new";

  return (
    <button
      type="button"
      onClick={() => router.push(href)}
      className="flex h-[43px] w-[133px] cursor-pointer items-center justify-center gap-[6px] rounded-[46px] border border-brand px-4 py-3 font-sans text-base font-bold text-brand hover:bg-brand hover:text-cream transition-colors"
    >
      <span className="text-lg leading-none">+</span>
      <span>New Note</span>
    </button>
  );
}
