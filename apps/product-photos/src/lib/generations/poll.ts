import { prisma } from "@/lib/db/client";
import { provider } from "@/lib/ai/product-photo-provider";
import { consumeOneCredit, getCredits } from "@/lib/credits/service";
import { storage, mediaKey, mediaApiUrl } from "@/lib/storage/index";

export type PollResult =
  | { code: "NOT_FOUND" }
  | { status: "pending" }
  | { status: "completed"; generatedImageUrl: string; creditsRemaining: number }
  | { status: "failed"; error: string };

export async function pollGeneration(args: { userId: string; id: string }): Promise<PollResult> {
  const { userId, id } = args;
  const row = await prisma.generation.findUnique({ where: { id } });
  if (!row || row.userId !== userId) return { code: "NOT_FOUND" };

  if (row.status === "completed") {
    return {
      status: "completed",
      generatedImageUrl: row.generatedImageUrl ?? mediaApiUrl(id, "generated"),
      creditsRemaining: await getCredits(userId),
    };
  }
  if (row.status === "failed") {
    return { status: "failed", error: row.error ?? "generation failed" };
  }
  if (!row.providerJobId) return { status: "pending" };

  const job = await provider.getJob(row.providerJobId);

  if (job.status === "pending") return { status: "pending" };

  if (job.status === "failed") {
    await prisma.generation.update({
      where: { id },
      data: { status: "failed", error: job.error },
    });
    return { status: "failed", error: job.error };
  }

  // completed — download and persist the image before touching credits
  const res = await fetch(job.imageUrl);
  if (!res.ok) return { status: "pending" }; // transient; try again next poll
  const buf = Buffer.from(await res.arrayBuffer());
  await storage.put(mediaKey(id, "generated", "png"), buf, "image/png");

  const generatedImageUrl = mediaApiUrl(id, "generated");
  await prisma.$transaction(async (tx) => {
    const fresh = await tx.generation.findUnique({ where: { id }, select: { status: true } });
    if (fresh?.status !== "pending") return;
    await tx.generation.update({ where: { id }, data: { status: "completed", generatedImageUrl } });
    await consumeOneCredit(tx, userId);
  });

  return { status: "completed", generatedImageUrl, creditsRemaining: await getCredits(userId) };
}
