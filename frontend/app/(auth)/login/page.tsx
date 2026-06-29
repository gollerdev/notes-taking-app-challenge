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

/** Login page — authenticates existing users. */
export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [error, setError] = useState<string | undefined>();

  const handleSubmit = async (credentials: AuthCredentials) => {
    setError(undefined);
    try {
      const tokens = await authService.login(credentials);
      login(tokens);
      router.replace("/notes");
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as Record<string, unknown>;
        const message =
          typeof body?.detail === "string"
            ? body.detail
            : "Login failed. Please try again.";
        setError(message);
      } else {
        setError("An unexpected error occurred.");
      }
    }
  };

  return (
    <AuthForm
      greeting="Yay, You're Back!"
      illustration={
        <Image
          src="/images/cactus.png"
          alt="Cactus illustration"
          width={95}
          height={114}
          priority
        />
      }
      submitLabel="Login"
      onSubmit={handleSubmit}
      error={error}
      footer={
        <Link href="/register" className="text-brand text-[12px] font-sans underline">
          {"Oops! I've never been here before"}
        </Link>
      }
    />
  );
}
