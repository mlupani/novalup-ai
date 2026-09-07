import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth/session", () => ({ requireUser: vi.fn() }));
vi.mock("@/lib/generations/create", () => ({ createBatch: vi.fn() }));

import { POST } from "@/app/api/generations/route";
import { requireUser } from "@/lib/auth/session";
import { createBatch } from "@/lib/generations/create";

const pngFile = (name = "ref.png") =>
  new File([new Uint8Array([1, 2, 3])], name, { type: "image/png" });

const okPhotos = [
  { format: "1:1", style: "studio", background: "clean" },
  { format: "4:5", style: "luxury", background: "premium" },
];

function reqWith(parts: { refs?: File[]; photos?: string; instructions?: string }) {
  const fd = new FormData();
  for (const f of parts.refs ?? []) fd.append("referenceImages", f);
  if (parts.photos !== undefined) fd.append("photos", parts.photos);
  if (parts.instructions !== undefined) fd.append("instructions", parts.instructions);
  return new Request("http://x/api/generations", { method: "POST", body: fd });
}

beforeEach(() => {
  vi.mocked(requireUser).mockResolvedValue({ id: "u1", email: "a@b.com", name: "Ana" });
  vi.mocked(createBatch).mockReset().mockResolvedValue({ ok: true, ids: ["g1", "g2"] });
});

describe("POST /api/generations", () => {
  it("401 without a session", async () => {
    vi.mocked(requireUser).mockResolvedValue(null);
    expect((await POST(reqWith({ refs: [pngFile()], photos: JSON.stringify(okPhotos) }))).status).toBe(401);
  });

  it("422 when no reference images are sent", async () => {
    const res = await POST(reqWith({ photos: JSON.stringify(okPhotos) }));
    expect(res.status).toBe(422);
  });

  it("422 when photos is not valid JSON", async () => {
    const res = await POST(reqWith({ refs: [pngFile()], photos: "not json" }));
    expect(res.status).toBe(422);
  });

  it("422 when photos has more than MAX_PHOTOS entries", async () => {
    const tooMany = Array(5).fill({ format: "1:1", style: "studio", background: "clean" });
    const res = await POST(reqWith({ refs: [pngFile()], photos: JSON.stringify(tooMany) }));
    expect(res.status).toBe(422);
  });

  it("201 with the batch ids on the happy path and passes parsed photos + buffers to createBatch", async () => {
    const res = await POST(reqWith({ refs: [pngFile()], photos: JSON.stringify(okPhotos), instructions: "soft light" }));
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ ids: ["g1", "g2"] });
    expect(createBatch).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "u1",
        instructions: "soft light",
        photos: okPhotos,
        referenceImages: [expect.objectContaining({ contentType: "image/png" })],
      }),
    );
  });

  it("403 with needed/available when createBatch reports NO_CREDITS", async () => {
    vi.mocked(createBatch).mockResolvedValue({ ok: false, code: "NO_CREDITS", needed: 3, available: 2 });
    const res = await POST(reqWith({ refs: [pngFile()], photos: JSON.stringify(okPhotos) }));
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ code: "NO_CREDITS", needed: 3, available: 2 });
  });

  it("409 when createBatch reports GENERATION_IN_PROGRESS", async () => {
    vi.mocked(createBatch).mockResolvedValue({ ok: false, code: "GENERATION_IN_PROGRESS" });
    const res = await POST(reqWith({ refs: [pngFile()], photos: JSON.stringify(okPhotos) }));
    expect(res.status).toBe(409);
  });

  it("502 when createBatch reports PROVIDER_ERROR", async () => {
    vi.mocked(createBatch).mockResolvedValue({ ok: false, code: "PROVIDER_ERROR" });
    const res = await POST(reqWith({ refs: [pngFile()], photos: JSON.stringify(okPhotos) }));
    expect(res.status).toBe(502);
  });
});
