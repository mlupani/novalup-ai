import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { feedbackSchema } from "@/lib/validation/schemas";
import { submitFeedback } from "@/lib/feedback/formsubmit";

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = feedbackSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "validation", issues: parsed.error.flatten() }, { status: 422 });
  }

  try {
    await submitFeedback(parsed.data);
  } catch {
    return NextResponse.json({ error: "send_failed" }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
