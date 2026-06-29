"use client";

interface NewNoteButtonProps {
  onClick: () => void;
}

/** "+ New Note" CTA button per Figma — pill shape with brand border. */
export function NewNoteButton({ onClick }: NewNoteButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-[43px] w-[133px] cursor-pointer items-center justify-center gap-[6px] rounded-[46px] border border-brand px-4 py-3 font-sans text-base font-bold text-brand hover:bg-brand hover:text-cream transition-colors"
    >
      <span className="text-lg leading-none">+</span>
      <span>New Note</span>
    </button>
  );
}
