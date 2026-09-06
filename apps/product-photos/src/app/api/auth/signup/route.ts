import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { hashPassword } from "@/lib/auth/password";
import { signupSchema } from "@/lib/validation/schemas";
import { FREE_CREDITS } from "@/lib/credits/config";

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = signupSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation", issues: parsed.error.flatten() }, { status: 422 });
  }

  const { name, email, password } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "email_taken" }, { status: 409 });

  const passwordHash = await hashPassword(password);
  await prisma.user.create({ data: { name, email, passwordHash, credits: FREE_CREDITS } });

  return NextResponse.json({ ok: true }, { status: 201 });
}
