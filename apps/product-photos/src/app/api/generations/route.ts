import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { batchInputSchema } from "@/lib/validation/schemas";
import { assertValidImage } from "@/lib/validation/upload";
import { MAX_REFERENCE_IMAGES } from "@/lib/limits";
import { createBatch } from "@/lib/generations/create";
import type { FormatId, StyleId, BackgroundId } from "@/lib/ai/options";

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const form = await request.formData();

  const files = form.getAll("referenceImages").filter((f): f is File => f instanceof File);
  if (files.length < 1 || files.length > MAX_REFERENCE_IMAGES) {
    return NextResponse.json({ error: "reference_images", reason: "count" }, { status: 422 });
  }
  for (const f of files) {
    const check = assertValidImage({ type: f.type, size: f.size });
    if (!check.ok) {
      return NextResponse.json({ error: "invalid_image", reason: check.reason }, { status: 422 });
    }
  }

  const photosRaw = form.get("photos");
  let photosParsed: unknown;
  try {
    photosParsed = JSON.parse(typeof photosRaw === "string" ? photosRaw : "");
  } catch {
    return NextResponse.json({ error: "validation", reason: "photos_json" }, { status: 422 });
  }

  const instructionsRaw = form.get("instructions");
  const parsed = batchInputSchema.safeParse({
    photos: photosParsed,
    instructions: typeof instructionsRaw === "string" && instructionsRaw.trim() ? instructionsRaw : undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "validation", issues: parsed.error.flatten() }, { status: 422 });
  }

  const referenceImages = await Promise.all(
    files.map(async (f) => ({ data: Buffer.from(await f.arrayBuffer()), contentType: f.type })),
  );

  // batchInputSchema validated each field against the catalog guards (isFormatId/…).
  const photos = parsed.data.photos as { format: FormatId; style: StyleId; background: BackgroundId }[];

  const result = await createBatch({
    userId: user.id,
    referenceImages,
    photos,
    instructions: parsed.data.instructions,
  });

  if (result.ok) return NextResponse.json({ ids: result.ids }, { status: 201 });
  if (result.code === "NO_CREDITS") {
    return NextResponse.json(
      { code: "NO_CREDITS", needed: result.needed, available: result.available },
      { status: 403 },
    );
  }
  const status = result.code === "GENERATION_IN_PROGRESS" ? 409 : 502;
  return NextResponse.json({ code: result.code }, { status });
}
