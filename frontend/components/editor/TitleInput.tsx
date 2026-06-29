"use client";

interface TitleInputProps {
  value: string;
  onChange: (value: string) => void;
}

/** Large h1-style transparent text input for the note title per Figma node 12:263. */
export function TitleInput({ value, onChange }: TitleInputProps) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Note Title"
      className="w-full bg-transparent font-serif text-2xl font-bold leading-normal text-black outline-none placeholder:text-black/40"
    />
  );
}
