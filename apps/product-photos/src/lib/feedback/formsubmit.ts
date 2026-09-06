import type { FeedbackInput } from "@/lib/validation/schemas";

export async function submitFeedback(input: FeedbackInput): Promise<void> {
  const email = process.env.FORMSUBMIT_EMAIL;
  if (!email) throw new Error("FORMSUBMIT_EMAIL is not set");

  const res = await fetch(`https://formsubmit.co/ajax/${email}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      _subject: "Novalup AI — Product Photos feedback",
      name: input.name,
      email: input.email,
      message: input.thoughts,
      next_ideas: input.nextIdeas,
    }),
  });

  if (!res.ok) throw new Error(`FormSubmit failed: ${res.status}`);
  const body = (await res.json().catch(() => ({}))) as { success?: string | boolean };
  if (body.success === "false" || body.success === false) {
    throw new Error("FormSubmit rejected the submission");
  }
}
