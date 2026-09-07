export type FeedbackSubmission = { email: string; message: string };

export async function submitFeedback(input: FeedbackSubmission): Promise<void> {
  const email = process.env.FORMSUBMIT_EMAIL;
  if (!email) throw new Error("FORMSUBMIT_EMAIL is not set");

  // FormSubmit rejects server-to-server calls that arrive without a Referer
  // ("Make sure you open this page through a web server…") and ties a form's
  // one-time activation to that Referer's domain, so point it at the page the
  // form actually lives on.
  const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const referer = new URL("/app", appUrl).toString();

  const res = await fetch(`https://formsubmit.co/ajax/${email}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Referer: referer,
    },
    body: JSON.stringify({
      _subject: "Novalup AI — Product Photos feedback",
      _replyto: input.email,
      email: input.email,
      message: input.message,
    }),
  });

  if (!res.ok) throw new Error(`FormSubmit failed: ${res.status}`);
  const body = (await res.json().catch(() => ({}))) as { success?: string | boolean };
  if (body.success === "false" || body.success === false) {
    throw new Error("FormSubmit rejected the submission");
  }
}
