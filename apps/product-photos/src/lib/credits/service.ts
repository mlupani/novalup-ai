import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/client";
import { FREE_CREDITS } from "@/lib/credits/config";

export async function getCredits(userId: string): Promise<number> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { credits: true },
  });
  return user.credits;
}

export async function grantFreeCredits(userId: string): Promise<void> {
  await prisma.user.update({ where: { id: userId }, data: { credits: FREE_CREDITS } });
}

export async function consumeOneCredit(
  tx: Prisma.TransactionClient,
  userId: string,
): Promise<boolean> {
  const res = await tx.user.updateMany({
    where: { id: userId, credits: { gt: 0 } },
    data: { credits: { decrement: 1 } },
  });
  return res.count === 1;
}
