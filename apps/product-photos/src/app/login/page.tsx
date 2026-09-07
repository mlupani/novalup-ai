import { AuthShell } from "@/components/auth/AuthShell";
import { AuthForm } from "@/components/auth/AuthForm";
import { GoogleButton } from "@/components/auth/GoogleButton";
import copy from "@/content/copy";

export default function LoginPage() {
  return (
    <AuthShell
      title={copy.auth.loginTitle}
      footer={{ text: copy.auth.noAccount, href: "/signup", linkLabel: copy.landing.signup }}
    >
      <GoogleButton />
      <div className="text-center text-xs uppercase tracking-wide text-neutral-500">{copy.auth.or}</div>
      <AuthForm mode="login" />
    </AuthShell>
  );
}
