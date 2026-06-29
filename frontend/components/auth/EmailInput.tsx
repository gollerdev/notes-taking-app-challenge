"use client";

interface EmailInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

/** Email input field styled per Figma design tokens. */
export function EmailInput({ value, onChange, error }: EmailInputProps) {
  return (
    <div className="flex flex-col items-start w-[384px]">
      <div
        className={`flex items-center gap-[8px] h-[39px] w-full rounded-[6px] border border-solid px-[15px] py-[7px] ${
          error ? "border-red-600" : "border-brand"
        }`}
      >
        <input
          type="email"
          placeholder="Email address"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Email address"
          className="flex-1 min-w-0 bg-transparent text-[12px] font-normal leading-normal text-black placeholder:text-black outline-none font-sans"
        />
      </div>
      {error && <p className="text-red-600 text-[12px] mt-1 font-sans">{error}</p>}
    </div>
  );
}
