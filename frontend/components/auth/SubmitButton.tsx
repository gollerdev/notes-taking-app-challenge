"use client";

interface SubmitButtonProps {
  label: string;
  loading: boolean;
  disabled?: boolean;
}

/** Primary CTA button (outlined), styled per Figma. Disabled while loading. */
export function SubmitButton({ label, loading, disabled }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className="flex items-center justify-center gap-[6px] h-[43px] w-[384px] rounded-[46px] border border-solid border-brand bg-transparent px-[16px] py-[12px] text-brand text-[16px] font-bold font-sans leading-normal cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand/5 transition-colors"
    >
      {loading ? "Loading..." : label}
    </button>
  );
}
