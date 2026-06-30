"use client";

interface BodyTextareaProps {
  value: string;
  onChange: (value: string) => void;
}

/** Plain-text textarea for the note body per Figma node 12:264. */
export function BodyTextarea({ value, onChange }: BodyTextareaProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Pour your heart out..."
      className="scrollbar-brand w-full flex-1 resize-none bg-transparent font-sans text-base font-normal leading-[27px] text-black outline-none placeholder:text-black/40"
    />
  );
}
