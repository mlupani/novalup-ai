import { prisma } from "@/lib/db/client";
import { getCredits } from "@/lib/credits/service";
import { buildPrompt } from "@/lib/ai/prompt";
import { formatToAspectRatio } from "@/lib/ai/options";
import type { FormatId, StyleId, BackgroundId } from "@/lib/ai/options";
import { provider } from "@/lib/ai/product-photo-provider";
import { uploadImages } from "@/lib/storage/cloudinary";

const STALE_MS = 5 * 60 * 1000;

type Result =
  | { ok: true; ids: string[] }
  | { ok: false; code: "NO_CREDITS"; needed: number; available: number }
  | { ok: false; code: "GENERATION_IN_PROGRESS" }
  | { ok: false; code: "PROVIDER_ERROR" };

export async function createBatch(args: {
  userId: string;
  referenceImages: { data: Buffer; contentType: string }[]; // 1–MAX_REFERENCE_IMAGES
  photos: { format: FormatId; style: StyleId; background: BackgroundId }[]; // 1–MAX_PHOTOS
  instructions?: string;
}): Promise<Result> {
  const { userId, referenceImages, photos, instructions } = args;

  // 1. Reap abandoned pendings (F1 reap) — credits decrement only at poll time, so a
  //    never-polled pending would otherwise hold a free slot forever once stale.
  await prisma.generation.updateMany({
    where: { userId, status: "pending", createdAt: { lte: new Date(Date.now() - STALE_MS) } },
    data: { status: "failed", error: "timeout" },
  });

  // 2. In-progress guard — ANY live pending (no createdAt filter, per the F1 fix).
  const inProgress = await prisma.generation.findFirst({
    where: { userId, status: "pending" },
    select: { id: true },
  });
  if (inProgress) return { ok: false, code: "GENERATION_IN_PROGRESS" };

  // 3. Credit gate — block the whole batch if fewer credits than photos.
  const available = await getCredits(userId);
  if (available < photos.length) {
    return { ok: false, code: "NO_CREDITS", needed: photos.length, available };
  }

  // 4. Upload the shared reference images once to Cloudinary. The returned URLs
  //    are both stored on every row and passed to the provider as `image_input`.
  let imageUrls: string[];
  try {
    imageUrls = await uploadImages(
      referenceImages.map((img) => ({ data: img.data, contentType: img.contentType })),
    );
  } catch (err) {
    // Nothing is created yet, so the failure leaves no row to record it on —
    // without this the caller only ever sees an opaque 502.
    console.error("[createBatch] reference image upload failed:", err);
    return { ok: false, code: "PROVIDER_ERROR" };
  }

  // 5. One unit per photo, kicked off in parallel. Each creates its row first
  //    (so it always resolves with an id), then starts the job in a try;
  //    a per-photo failure marks only that row failed.
  const startPhoto = async (photo: {
    format: FormatId;
    style: StyleId;
    background: BackgroundId;
  }): Promise<string> => {
    const aspectRatio = formatToAspectRatio(photo.format);
    const prompt = buildPrompt({ style: photo.style, background: photo.background, instructions });

    const gen = await prisma.generation.create({
      data: {
        userId,
        referenceImageUrls: imageUrls,
        format: photo.format,
        style: photo.style,
        background: photo.background,
        instructions: instructions ?? null,
        prompt,
        status: "pending",
      },
    });

    try {
      if (!aspectRatio) throw new Error("invalid format"); // guarded earlier by zod
      const { jobId } = await provider.createJob({ imageUrls, prompt, aspectRatio });
      await prisma.generation.update({ where: { id: gen.id }, data: { providerJobId: jobId } });
    } catch (err) {
      await prisma.generation.update({
        where: { id: gen.id },
        data: { status: "failed", error: err instanceof Error ? err.message : "provider error" },
      });
    }
    return gen.id;
  };

  const settled = await Promise.allSettled(photos.map((p) => startPhoto(p)));
  const ids = settled
    .filter((s): s is PromiseFulfilledResult<string> => s.status === "fulfilled")
    .map((s) => s.value);

  // Every unit rejected → prisma.generation.create itself threw (DB down): infra failure.
  if (ids.length === 0) return { ok: false, code: "PROVIDER_ERROR" };
  return { ok: true, ids };
}
