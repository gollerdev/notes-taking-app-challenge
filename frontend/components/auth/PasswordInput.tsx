"use client";

import { useState } from "react";

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

function EyeOpenIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M2.42012 12.7132C2.28394 12.4975 2.21584 12.3897 2.17772 12.2234C2.14909 12.0985 2.14909 11.9015 2.17772 11.7766C2.21584 11.6103 2.28394 11.5025 2.42012 11.2868C3.54553 9.50484 6.8954 5 12.0004 5C17.1054 5 20.4553 9.50484 21.5807 11.2868C21.7169 11.5025 21.785 11.6103 21.8231 11.7766C21.8517 11.9015 21.8517 12.0985 21.8231 12.2234C21.785 12.3897 21.7169 12.4975 21.5807 12.7132C20.4553 14.4952 17.1054 19 12.0004 19C6.8954 19 3.54553 14.4952 2.42012 12.7132Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.0004 15C13.6573 15 15.0004 13.6569 15.0004 12C15.0004 10.3431 13.6573 9 12.0004 9C10.3435 9 9.0004 10.3431 9.0004 12C9.0004 13.6569 10.3435 15 12.0004 15Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EyeClosedIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M4.15411 18.7775C3.87268 19.2527 4.02975 19.8661 4.50495 20.1475C4.98015 20.429 5.59352 20.2719 5.87496 19.7967L4.15411 18.7775ZM6.43304 14.9296L4.15411 18.7775L5.87496 19.7967L8.15388 15.9488L6.43304 14.9296Z"
        fill="currentColor"
      />
      <path
        d="M6.00024 14C12.0002 18 20.0002 18 26.0002 14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M9.35035 21.4228C9.26164 21.9679 9.63162 22.4817 10.1767 22.5704C10.7218 22.6592 11.2357 22.2892 11.3244 21.7441L9.35035 21.4228ZM10.259 15.8394L9.35035 21.4228L11.3244 21.7441L12.233 16.1607L10.259 15.8394Z"
        fill="currentColor"
      />
      <path
        d="M13.9998 22.0002C13.9998 22.5525 14.4475 23.0002 14.9998 23.0002C15.552 23.0003 15.9998 22.5526 15.9998 22.0003L13.9998 22.0002ZM14.0001 17.0001L13.9998 22.0002L15.9998 22.0003L16.0001 17.0002L14.0001 17.0001Z"
        fill="currentColor"
      />
      <path
        d="M20.0194 22.1961C20.1278 22.7377 20.6546 23.0889 21.1961 22.9806C21.7377 22.8722 22.0889 22.3454 21.9806 21.8039L20.0194 22.1961ZM19.0193 17.1962L20.0194 22.1961L21.9806 21.8039L20.9805 16.8039L19.0193 17.1962Z"
        fill="currentColor"
      />
      <path
        d="M25.1804 20.5732C25.4968 21.0258 26.1203 21.1363 26.5729 20.8199C27.0256 20.5034 27.136 19.88 26.8196 19.4273L25.1804 20.5732ZM22.3843 16.5732L25.1804 20.5732L26.8196 19.4273L24.0235 15.4273L22.3843 16.5732Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Password input with show/hide toggle, styled per Figma. */
export function PasswordInput({ value, onChange, error }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="flex flex-col items-start w-[384px]">
      <div
        className={`flex items-center gap-[8px] h-[39px] w-full rounded-[6px] border border-solid px-[15px] py-[7px] ${
          error ? "border-red-600" : "border-brand"
        }`}
      >
        <input
          type={visible ? "text" : "password"}
          placeholder="Password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Password"
          className="flex-1 min-w-0 bg-transparent text-[12px] font-normal leading-normal text-black placeholder:text-black outline-none font-sans"
        />
        <button
          type="button"
          onClick={() => setVisible((prev) => !prev)}
          className="shrink-0 flex items-center text-brand cursor-pointer"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeClosedIcon /> : <EyeOpenIcon />}
        </button>
      </div>
      {error && <p className="text-red-600 text-[12px] mt-1 font-sans">{error}</p>}
    </div>
  );
}
