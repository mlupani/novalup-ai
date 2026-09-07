import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { AuthForm } from "@/components/auth/AuthForm";
import { GoogleButton } from "@/components/auth/GoogleButton";
import copy from "@/content/copy";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6 py-12">
      <h1 className="text-2xl font-bold">{copy.auth.loginTitle}</h1>
      <Card className="flex flex-col gap-5">
        <GoogleButton />
        <div className="text-center text-xs uppercase tracking-wide text-neutral-500">{copy.auth.or}</div>
        <AuthForm mode="login" />
      </Card>
      <p className="text-sm text-neutral-400">
        {copy.auth.noAccount} <Link href="/signup" className="text-accent-light hover:underline">{copy.landing.signup}</Link>
      </p>
    </main>
  );
}
