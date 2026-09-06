import { describe, it, expect, vi, beforeEach } from "vitest";

const { generation } = vi.hoisted(() => ({
  generation: { create: vi.fn(), update: vi.fn(), findFirst: vi.fn() },
}));
vi.mock("@/lib/db/client", () => ({ prisma: { generation } }));
vi.mock("@/lib/credits/service", () => ({ getCredits: vi.fn() }));
vi.mock("@/lib/storage/index", () => ({
  storage: { put: vi.fn().mockResolvedValue({ url: "k" }) },
  mediaKey: (id: string, k: string, e: string) => `${id}/${k}.${e}`,
  mediaApiUrl: (id: string, k: string) => `/api/media/${id}/${k}`,
}));
vi.mock("@/lib/ai/product-photo-provider", () => ({ provider: { createJob: vi.fn() } }));

import { createGeneration } from "@/lib/generations/create";
import { getCredits } from "@/lib/credits/service";
import { provider } from "@/lib/ai/product-photo-provider";

const baseArgs = {
  userId: "u1",
  image: Buffer.from("img"),
  contentType: "image/png",
  input: { format: "1:1", style: "studio", background: "clean" } as const,
};

beforeEach(() => {
  Object.values(generation).forEach((f) => f.mockReset());
  generation.findFirst.mockResolvedValue(null);
  generation.create.mockResolvedValue({ id: "g1" });
  generation.update.mockResolvedValue({});
  vi.mocked(getCredits).mockResolvedValue(3);
  vi.mocked(provider.createJob).mockResolvedValue({ jobId: "task_1" });
});

describe("createGeneration", () => {
  it("blocks when a pending generation exists", async () => {
    generation.findFirst.mockResolvedValue({ id: "old" });
    expect(await createGeneration(baseArgs)).toEqual({ ok: false, code: "GENERATION_IN_PROGRESS" });
  });
  it("blocks when the user has 0 credits", async () => {
    vi.mocked(getCredits).mockResolvedValue(0);
    expect(await createGeneration(baseArgs)).toEqual({ ok: false, code: "NO_CREDITS" });
    expect(generation.create).not.toHaveBeenCalled();
  });
  it("creates the row, stores the original, starts the job, saves jobId", async () => {
    const res = await createGeneration(baseArgs);
    expect(res).toEqual({ ok: true, id: "g1" });
    expect(generation.update).toHaveBeenCalledWith({ where: { id: "g1" }, data: { providerJobId: "task_1" } });
    expect(provider.createJob).toHaveBeenCalledWith(
      expect.objectContaining({ aspectRatio: "1:1", prompt: expect.stringMatching(/photorealistic/i) }),
    );
  });
  it("marks the row failed and returns PROVIDER_ERROR when the provider throws", async () => {
    vi.mocked(provider.createJob).mockRejectedValue(new Error("kie down"));
    expect(await createGeneration(baseArgs)).toEqual({ ok: false, code: "PROVIDER_ERROR" });
    expect(generation.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "g1" }, data: expect.objectContaining({ status: "failed" }) }),
    );
  });
});
