"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";
import { authService } from "@/services/auth";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";
import type { AuthCredentials } from "@/types";

/** Register page — creates new user accounts. */
export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [error, setError] = useState<string | undefined>();

  const handleSubmit = async (credentials: AuthCredentials) => {
    setError(undefined);
    try {
      const tokens = await authService.register(credentials);
      login(tokens);
      router.replace("/notes");
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as Record<string, unknown>;
        const message =
          typeof body?.detail === "string"
            ? body.detail
            : "Registration failed. Please try again.";
        setError(message);
      } else {
        setError("An unexpected error occurred.");
      }
    }
  };

  return (
    <AuthForm
      greeting="Yay, New Friend!"
      illustration={
        <Image
          src="/images/cat.png"
          alt="Sleeping cat illustration"
          width={188}
          height={134}
          priority
        />
      }
      submitLabel="Sign Up"
      onSubmit={handleSubmit}
      error={error}
      footer={
        <Link href="/login" className="text-brand text-[12px] font-sans underline">
          {"We're already friends!"}
        </Link>
      }
    />
  );
}
