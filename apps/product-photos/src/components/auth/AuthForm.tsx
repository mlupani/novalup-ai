"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Field, inputClass } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import copy from "@/content/copy";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const data = new FormData(e.currentTarget);
    const email = String(data.get("email"));
    const password = String(data.get("password"));
    setPending(true);
    try {
      if (mode === "signup") {
        if (password !== String(data.get("confirmPassword"))) {
          setError(copy.errors.passwordMismatch);
          setPending(false);
          return;
        }
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: data.get("name"), email, password, confirmPassword: data.get("confirmPassword") }),
        });
        if (res.status === 409) {
          setError(copy.errors.emailTaken);
          setPending(false);
          return;
        }
        if (!res.ok) {
          setError(copy.errors.generic);
          setPending(false);
          return;
        }
      }
      const res = await signIn("credentials", { email, password, redirect: false });
      if (res?.error) {
        setError(mode === "login" ? copy.errors.invalidCredentials : copy.errors.generic);
        setPending(false);
        return;
      }
      router.push("/app");
      router.refresh();
    } catch {
      setError(copy.errors.generic);
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {mode === "signup" && (
        <Field label={copy.auth.name} htmlFor="name">
          <input id="name" name="name" required minLength={2} className={inputClass} />
        </Field>
      )}
      <Field label={copy.auth.email} htmlFor="email">
        <input id="email" name="email" type="email" required className={inputClass} />
      </Field>
      <Field label={copy.auth.password} htmlFor="password">
        <input id="password" name="password" type="password" required minLength={mode === "signup" ? 8 : 1} className={inputClass} />
      </Field>
      {mode === "signup" && (
        <Field label={copy.auth.confirmPassword} htmlFor="confirmPassword">
          <input id="confirmPassword" name="confirmPassword" type="password" required minLength={8} className={inputClass} />
        </Field>
      )}
      {error ? <p className="text-sm text-accent-light">{error}</p> : null}
      <Button type="submit" disabled={pending} className="w-full">
        {mode === "login" ? copy.auth.submitLogin : copy.auth.submitSignup}
      </Button>
    </form>
  );
}
