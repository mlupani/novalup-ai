import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { pollGeneration } from "@/lib/generations/poll";

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const result = await pollGeneration({ userId: user.id, id });
  if ("code" in result && result.code === "NOT_FOUND") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json(result);
}
