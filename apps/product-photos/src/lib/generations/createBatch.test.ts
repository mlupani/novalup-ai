import { describe, it, expect, vi, beforeEach } from "vitest";

const { generation, storage } = vi.hoisted(() => ({
  generation: { create: vi.fn(), update: vi.fn(), findFirst: vi.fn(), updateMany: vi.fn() },
  storage: { put: vi.fn() },
}));
vi.mock("@/lib/db/client", () => ({ prisma: { generation } }));
vi.mock("@/lib/credits/service", () => ({ getCredits: vi.fn() }));
vi.mock("@/lib/storage/index", () => ({
  storage,
  mediaKey: (id: string, k: string, e: string) => `${id}/${k}.${e}`,
  mediaApiUrl: (id: string, k: string) => `/api/media/${id}/${k}`,
}));
vi.mock("@/lib/ai/product-photo-provider", () => ({ provider: { uploadImages: vi.fn(), createJob: vi.fn() } }));

import { createBatch } from "@/lib/generations/create";
import { getCredits } from "@/lib/credits/service";
import { provider } from "@/lib/ai/product-photo-provider";
import type { FormatId, StyleId, BackgroundId } from "@/lib/ai/options";

const baseArgs = {
  userId: "u1",
  referenceImages: [{ data: Buffer.from("r0"), contentType: "image/png" }],
  photos: [
    { format: "1:1", style: "studio", background: "clean" },
    { format: "4:5", style: "luxury", background: "premium" },
    { format: "9:16", style: "minimal", background: "natural" },
  ] as { format: FormatId; style: StyleId; background: BackgroundId }[],
};

beforeEach(() => {
  Object.values(generation).forEach((f) => f.mockReset());
  storage.put.mockReset().mockResolvedValue({ url: "k" });
  generation.findFirst.mockResolvedValue(null);
  generation.updateMany.mockResolvedValue({ count: 0 });
  let n = 0;
  generation.create.mockImplementation(() => Promise.resolve({ id: `g${++n}` }));
  generation.update.mockResolvedValue({});
  vi.mocked(getCredits).mockResolvedValue(3);
  vi.mocked(provider.uploadImages).mockReset().mockResolvedValue(["https://cdn/r0.png"]);
  vi.mocked(provider.createJob).mockReset().mockResolvedValue({ jobId: "task" });
});

describe("createBatch", () => {
  it("blocks with GENERATION_IN_PROGRESS when a pending row exists", async () => {
    generation.findFirst.mockResolvedValue({ id: "old" });
    expect(await createBatch(baseArgs)).toEqual({ ok: false, code: "GENERATION_IN_PROGRESS" });
    expect(generation.create).not.toHaveBeenCalled();
  });

  it("reaps stale pendings before the in-progress guard", async () => {
    await createBatch(baseArgs);
    expect(generation.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: "u1",
          status: "pending",
          createdAt: expect.objectContaining({ lte: expect.any(Date) }),
        }),
        data: { status: "failed", error: "timeout" },
      }),
    );
    expect(generation.updateMany.mock.invocationCallOrder[0]).toBeLessThan(
      generation.findFirst.mock.invocationCallOrder[0],
    );
  });

  it("blocks with NO_CREDITS when credits < photos.length and creates nothing", async () => {
    vi.mocked(getCredits).mockResolvedValue(2);
    expect(await createBatch(baseArgs)).toEqual({ ok: false, code: "NO_CREDITS", needed: 3, available: 2 });
    expect(generation.create).not.toHaveBeenCalled();
    expect(provider.uploadImages).not.toHaveBeenCalled();
  });

  it("uploads references once, starts 3 jobs, returns 3 ids in photo order", async () => {
    const res = await createBatch(baseArgs);
    expect(res).toEqual({ ok: true, ids: ["g1", "g2", "g3"] });
    expect(provider.uploadImages).toHaveBeenCalledTimes(1);
    expect(provider.createJob).toHaveBeenCalledTimes(3);
    expect(generation.create).toHaveBeenCalledTimes(3);
  });

  it("returns PROVIDER_ERROR and creates nothing when reference upload throws", async () => {
    vi.mocked(provider.uploadImages).mockRejectedValue(new Error("kie upload down"));
    expect(await createBatch(baseArgs)).toEqual({ ok: false, code: "PROVIDER_ERROR" });
    expect(generation.create).not.toHaveBeenCalled();
  });

  it("one createJob failure fails only that row, still returns all ids", async () => {
    vi.mocked(provider.createJob)
      .mockResolvedValueOnce({ jobId: "t1" })
      .mockRejectedValueOnce(new Error("kie down"))
      .mockResolvedValueOnce({ jobId: "t3" });
    const res = await createBatch(baseArgs);
    expect(res.ok).toBe(true);
    expect((res as { ids: string[] }).ids).toEqual(["g1", "g2", "g3"]);
    expect(generation.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "failed" }) }),
    );
  });

  it("returns PROVIDER_ERROR when every row insert throws", async () => {
    generation.create.mockRejectedValue(new Error("db down"));
    expect(await createBatch(baseArgs)).toEqual({ ok: false, code: "PROVIDER_ERROR" });
  });
});
