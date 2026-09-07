import { AuthShell } from "@/components/auth/AuthShell";
import { AuthForm } from "@/components/auth/AuthForm";
import { GoogleButton } from "@/components/auth/GoogleButton";
import copy from "@/content/copy";

export default function SignupPage() {
  return (
    <AuthShell
      title={copy.auth.signupTitle}
      footer={{ text: copy.auth.haveAccount, href: "/login", linkLabel: copy.landing.login }}
    >
      <GoogleButton />
      <div className="text-center text-xs uppercase tracking-wide text-neutral-500">{copy.auth.or}</div>
      <AuthForm mode="signup" />
    </AuthShell>
  );
}
