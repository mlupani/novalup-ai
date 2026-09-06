import { prisma } from "@/lib/db/client";
import { getCredits } from "@/lib/credits/service";
import { buildPrompt } from "@/lib/ai/prompt";
import { formatToAspectRatio } from "@/lib/ai/options";
import { provider } from "@/lib/ai/product-photo-provider";
import { storage, mediaKey, mediaApiUrl } from "@/lib/storage/index";
import { contentTypeToExt } from "@/lib/validation/upload";
import type { GenerationInput } from "@/lib/validation/schemas";

const STALE_MS = 5 * 60 * 1000;

type Result =
  | { ok: true; id: string }
  | { ok: false; code: "NO_CREDITS" | "GENERATION_IN_PROGRESS" | "PROVIDER_ERROR" };

export async function createGeneration(args: {
  userId: string;
  image: Buffer;
  contentType: string;
  input: GenerationInput;
}): Promise<Result> {
  const { userId, image, contentType, input } = args;

  const inProgress = await prisma.generation.findFirst({
    where: { userId, status: "pending", createdAt: { gt: new Date(Date.now() - STALE_MS) } },
    select: { id: true },
  });
  if (inProgress) return { ok: false, code: "GENERATION_IN_PROGRESS" };

  if ((await getCredits(userId)) <= 0) return { ok: false, code: "NO_CREDITS" };

  const aspectRatio = formatToAspectRatio(input.format);
  if (!aspectRatio) return { ok: false, code: "PROVIDER_ERROR" }; // guarded earlier by zod

  const prompt = buildPrompt({
    style: input.style,
    background: input.background,
    instructions: input.instructions,
  });

  const generation = await prisma.generation.create({
    data: {
      userId,
      originalImageUrl: "",
      format: input.format,
      style: input.style,
      background: input.background,
      instructions: input.instructions ?? null,
      prompt,
      status: "pending",
    },
  });

  const ext = contentTypeToExt(contentType);
  await storage.put(mediaKey(generation.id, "original", ext), image, contentType);
  await prisma.generation.update({
    where: { id: generation.id },
    data: { originalImageUrl: mediaApiUrl(generation.id, "original") },
  });

  try {
    const { jobId } = await provider.createJob({
      image,
      fileName: `${generation.id}-original.${ext}`,
      contentType,
      prompt,
      aspectRatio,
    });
    await prisma.generation.update({ where: { id: generation.id }, data: { providerJobId: jobId } });
    return { ok: true, id: generation.id };
  } catch (err) {
    await prisma.generation.update({
      where: { id: generation.id },
      data: { status: "failed", error: err instanceof Error ? err.message : "provider error" },
    });
    return { ok: false, code: "PROVIDER_ERROR" };
  }
}
