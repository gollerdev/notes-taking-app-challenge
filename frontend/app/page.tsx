"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

/** Root redirect gate: sends to /login or /notes based on auth state.
 *  Waits for hydration to complete before redirecting to avoid
 *  flash-redirecting while tokens are being restored from localStorage. */
export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isHydrated } = useAuth();

  useEffect(() => {
    if (!isHydrated) return;

    if (isAuthenticated) {
      router.replace("/notes");
    } else {
      router.replace("/login");
    }
  }, [isAuthenticated, isHydrated, router]);

  return null;
}
