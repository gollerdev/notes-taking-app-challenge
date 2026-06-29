"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

/** Root redirect gate: sends to /login or /notes based on auth state. */
export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/notes");
    } else {
      router.replace("/login");
    }
  }, [isAuthenticated, router]);

  return null;
}
