"use client";
import { useState } from "react";
import { Field, inputClass } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import copy from "@/content/copy";

export function FeedbackForm({ defaultName, defaultEmail }: { defaultName: string; defaultEmail: string }) {
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (done) {
    return (
      <div className="flex flex-col gap-2">
        <p className="font-semibold text-white">{copy.feedback.thanksTitle}</p>
        <p className="text-sm text-neutral-400">{copy.feedback.thanksBody}</p>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const data = new FormData(e.currentTarget);
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.get("name"), email: data.get("email"),
        thoughts: data.get("thoughts"), nextIdeas: data.get("nextIdeas"),
      }),
    });
    setPending(false);
    if (res.ok) setDone(true);
    else setError(copy.errors.generic);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <p className="font-medium text-white">{copy.feedback.title}</p>
      <Field label={copy.feedback.name} htmlFor="fb-name">
        <input id="fb-name" name="name" defaultValue={defaultName} required className={inputClass} />
      </Field>
      <Field label={copy.feedback.email} htmlFor="fb-email">
        <input id="fb-email" name="email" type="email" defaultValue={defaultEmail} required className={inputClass} />
      </Field>
      <Field label={copy.feedback.thoughts} htmlFor="fb-thoughts">
        <textarea id="fb-thoughts" name="thoughts" rows={3} required maxLength={2000} className={inputClass} />
      </Field>
      <Field label={copy.feedback.nextIdeas} htmlFor="fb-next" error={error ?? undefined}>
        <textarea id="fb-next" name="nextIdeas" rows={2} required maxLength={2000} className={inputClass} />
      </Field>
      <Button type="submit" disabled={pending}>{pending ? copy.feedback.sending : copy.feedback.submit}</Button>
    </form>
  );
}
