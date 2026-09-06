import { describe, it, expect, vi, beforeEach } from "vitest";

const { updateMany, update, findUniqueOrThrow } = vi.hoisted(() => {
  return {
    updateMany: vi.fn(),
    update: vi.fn(),
    findUniqueOrThrow: vi.fn(),
  };
});

vi.mock("@/lib/db/client", () => ({
  prisma: { user: { updateMany, update, findUniqueOrThrow } },
}));

import { getCredits, grantFreeCredits, consumeOneCredit } from "@/lib/credits/service";
import { FREE_CREDITS } from "@/lib/credits/config";

beforeEach(() => {
  updateMany.mockReset();
  update.mockReset();
  findUniqueOrThrow.mockReset();
});

describe("credits service", () => {
  it("getCredits returns the stored balance", async () => {
    findUniqueOrThrow.mockResolvedValue({ credits: 2 });
    expect(await getCredits("u1")).toBe(2);
  });

  it("grantFreeCredits sets credits to FREE_CREDITS", async () => {
    update.mockResolvedValue({});
    await grantFreeCredits("u1");
    expect(update).toHaveBeenCalledWith({ where: { id: "u1" }, data: { credits: FREE_CREDITS } });
  });

  it("consumeOneCredit returns true when a row was decremented", async () => {
    const tx = { user: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) } };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(await consumeOneCredit(tx as any, "u1")).toBe(true);
    expect(tx.user.updateMany).toHaveBeenCalledWith({
      where: { id: "u1", credits: { gt: 0 } },
      data: { credits: { decrement: 1 } },
    });
  });

  it("consumeOneCredit returns false when the balance was already 0", async () => {
    const tx = { user: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) } };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(await consumeOneCredit(tx as any, "u1")).toBe(false);
  });
});
