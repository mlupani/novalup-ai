import { describe, it, expect, vi, beforeEach } from "vitest";

const { generation, txGeneration, txUser, $transaction } = vi.hoisted(() => {
  const generation = { findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() };
  const txGeneration = { findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() };
  const txUser = { updateMany: vi.fn() };
  const $transaction = vi.fn(async (fn: (tx: unknown) => unknown) =>
    fn({ generation: txGeneration, user: txUser }),
  );
  return { generation, txGeneration, txUser, $transaction };
});

vi.mock("@/lib/db/client", () => ({ prisma: { generation, $transaction } }));
vi.mock("@/lib/ai/product-photo-provider", () => ({ provider: { getJob: vi.fn() } }));
vi.mock("@/lib/credits/service", () => ({
  getCredits: vi.fn().mockResolvedValue(2),
  consumeOneCredit: vi.fn().mockResolvedValue(true),
}));
vi.mock("@/lib/storage/index", () => ({
  storage: { put: vi.fn().mockResolvedValue({ url: "k" }) },
  mediaKey: (id: string, k: string, e: string) => `${id}/${k}.${e}`,
  mediaApiUrl: (id: string, k: string) => `/api/media/${id}/${k}`,
}));

import { pollGeneration } from "@/lib/generations/poll";
import { provider } from "@/lib/ai/product-photo-provider";
import { consumeOneCredit } from "@/lib/credits/service";

beforeEach(() => {
  [generation.findUnique, generation.update, generation.updateMany, txGeneration.findUnique, txGeneration.update, txGeneration.updateMany, txUser.updateMany].forEach((f) => f.mockReset());
  vi.mocked(provider.getJob).mockReset();
  vi.mocked(consumeOneCredit).mockClear();
  txGeneration.updateMany.mockResolvedValue({ count: 1 });
  vi.spyOn(global, "fetch").mockResolvedValue(new Response(Buffer.from("PNG"), { status: 200 }));
});

describe("pollGeneration", () => {
  it("returns NOT_FOUND for another user's row", async () => {
    generation.findUnique.mockResolvedValue({ id: "g1", userId: "other" });
    expect(await pollGeneration({ userId: "u1", id: "g1" })).toEqual({ code: "NOT_FOUND" });
  });

  it("passes through provider pending", async () => {
    generation.findUnique.mockResolvedValue({ id: "g1", userId: "u1", status: "pending", providerJobId: "t1" });
    vi.mocked(provider.getJob).mockResolvedValue({ status: "pending" });
    expect(await pollGeneration({ userId: "u1", id: "g1" })).toEqual({ status: "pending" });
  });

  it("on provider failure marks failed and does not consume a credit", async () => {
    generation.findUnique.mockResolvedValue({ id: "g1", userId: "u1", status: "pending", providerJobId: "t1" });
    vi.mocked(provider.getJob).mockResolvedValue({ status: "failed", error: "blocked" });
    generation.updateMany.mockResolvedValue({ count: 1 });
    const res = await pollGeneration({ userId: "u1", id: "g1" });
    expect(res).toEqual({ status: "failed", error: "blocked" });
    expect(consumeOneCredit).not.toHaveBeenCalled();
    expect(generation.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ status: "pending" }), data: expect.objectContaining({ status: "failed", error: "blocked" }) }),
    );
  });

  it("when the provider call rejects, returns pending without throwing or consuming a credit", async () => {
    generation.findUnique.mockResolvedValue({ id: "g1", userId: "u1", status: "pending", providerJobId: "t1" });
    vi.mocked(provider.getJob).mockRejectedValue(new Error("kie 500"));
    const res = await pollGeneration({ userId: "u1", id: "g1" });
    expect(res).toEqual({ status: "pending" });
    expect(consumeOneCredit).not.toHaveBeenCalled();
    expect(generation.updateMany).not.toHaveBeenCalled();
  });

  it("on provider completion stores the image, transitions once, consumes one credit", async () => {
    generation.findUnique.mockResolvedValue({ id: "g1", userId: "u1", status: "pending", providerJobId: "t1" });
    vi.mocked(provider.getJob).mockResolvedValue({ status: "completed", imageUrl: "https://cdn/out.png" });
    txGeneration.updateMany.mockResolvedValue({ count: 1 });
    const res = await pollGeneration({ userId: "u1", id: "g1" });
    expect(res).toEqual({ status: "completed", generatedImageUrl: "/api/media/g1/generated", creditsRemaining: 2 });
    expect(consumeOneCredit).toHaveBeenCalledTimes(1);
  });

  it("a second poll of a completed row returns the stored result without consuming again", async () => {
    generation.findUnique.mockResolvedValue({
      id: "g1", userId: "u1", status: "completed", generatedImageUrl: "/api/media/g1/generated",
    });
    const res = await pollGeneration({ userId: "u1", id: "g1" });
    expect(res).toEqual({ status: "completed", generatedImageUrl: "/api/media/g1/generated", creditsRemaining: 2 });
    expect(consumeOneCredit).not.toHaveBeenCalled();
  });

  it("when the completion claim loses the race (updateMany count: 0), returns completed without consuming", async () => {
    generation.findUnique.mockResolvedValue({ id: "g1", userId: "u1", status: "pending", providerJobId: "t1" });
    vi.mocked(provider.getJob).mockResolvedValue({ status: "completed", imageUrl: "https://cdn/out.png" });
    txGeneration.updateMany.mockResolvedValue({ count: 0 });
    const res = await pollGeneration({ userId: "u1", id: "g1" });
    expect(res).toEqual({ status: "completed", generatedImageUrl: "/api/media/g1/generated", creditsRemaining: 2 });
    expect(consumeOneCredit).not.toHaveBeenCalled();
  });
});
