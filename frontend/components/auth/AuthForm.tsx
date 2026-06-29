"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { EmailInput } from "./EmailInput";
import { PasswordInput } from "./PasswordInput";
import { SubmitButton } from "./SubmitButton";
import { validateEmail, validatePassword } from "./validation";
import type { AuthCredentials } from "@/types";

interface AuthFormProps {
  greeting: string;
  illustration: ReactNode;
  submitLabel: string;
  onSubmit: (credentials: AuthCredentials) => Promise<void>;
  footer: ReactNode;
  error?: string;
}

/** Shared auth form shell used by both login and register pages. */
export function AuthForm({
  greeting,
  illustration,
  submitLabel,
  onSubmit,
  footer,
  error,
}: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    setEmailError(emailErr);
    setPasswordError(passwordErr);

    if (emailErr || passwordErr) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit({ email, password });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      noValidate
      onSubmit={(e) => {
        void handleSubmit(e);
      }}
      className="flex flex-col items-center"
    >
      <div className="mb-6">{illustration}</div>

      <h1 className="font-serif font-bold text-[48px] text-heading leading-normal mb-8">
        {greeting}
      </h1>

      {error && (
        <p className="text-red-600 text-[12px] mb-4 font-sans w-[384px]">{error}</p>
      )}

      <div className="flex flex-col gap-[13px] mb-8">
        <EmailInput value={email} onChange={setEmail} error={emailError} />
        <PasswordInput value={password} onChange={setPassword} error={passwordError} />
      </div>

      <SubmitButton label={submitLabel} loading={loading} />

      <div className="mt-4">{footer}</div>
    </form>
  );
}
