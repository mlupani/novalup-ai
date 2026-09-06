import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { generationInputSchema } from "@/lib/validation/schemas";
import { assertValidImage } from "@/lib/validation/upload";
import { createGeneration } from "@/lib/generations/create";

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const form = await request.formData();
  const file = form.get("image");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "invalid_image", reason: "missing" }, { status: 422 });
  }

  const check = assertValidImage({ type: file.type, size: file.size });
  if (!check.ok) {
    return NextResponse.json({ error: "invalid_image", reason: check.reason }, { status: 422 });
  }

  const parsed = generationInputSchema.safeParse({
    format: form.get("format"),
    style: form.get("style"),
    background: form.get("background"),
    instructions: form.get("instructions") || undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "validation", issues: parsed.error.flatten() }, { status: 422 });
  }

  const image = Buffer.from(await file.arrayBuffer());
  const result = await createGeneration({
    userId: user.id,
    image,
    contentType: file.type,
    input: parsed.data,
  });

  if (result.ok) return NextResponse.json({ id: result.id }, { status: 201 });
  const status = result.code === "NO_CREDITS" ? 403 : result.code === "GENERATION_IN_PROGRESS" ? 409 : 502;
  return NextResponse.json({ code: result.code }, { status });
}
