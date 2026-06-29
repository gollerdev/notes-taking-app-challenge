"use client";

import Image from "next/image";

/** Empty state rendered when no notes exist for the active filter. */
export function EmptyState() {
  return (
    <div className="flex flex-col items-center pt-[96px]">
      <Image
        src="/images/empty-state.png"
        alt="No notes illustration"
        width={297}
        height={296}
        className="pointer-events-none"
        priority
      />
      <p className="mt-0 font-sans text-2xl font-normal text-heading">
        {"I'm just here waiting for your charming notes..."}
      </p>
    </div>
  );
}
