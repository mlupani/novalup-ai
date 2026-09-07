"use client";
import { useState } from "react";
import { Field, inputClass } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import copy from "@/content/copy";

export function FeedbackForm() {
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
    const message = new FormData(e.currentTarget).get("message");

    let res: Response;
    try {
      res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
    } catch {
      setPending(false);
      setError(copy.errors.generic);
      return;
    }

    setPending(false);
    if (res.ok) setDone(true);
    else setError(copy.errors.generic);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <p className="font-medium text-white">{copy.feedback.title}</p>
      <Field label={copy.feedback.messageLabel} htmlFor="fb-message" error={error ?? undefined}>
        <textarea
          id="fb-message"
          name="message"
          rows={4}
          required
          maxLength={2000}
          placeholder={copy.feedback.messagePlaceholder}
          className={inputClass}
        />
      </Field>
      <Button type="submit" disabled={pending}>{pending ? copy.feedback.sending : copy.feedback.submit}</Button>
    </form>
  );
}
