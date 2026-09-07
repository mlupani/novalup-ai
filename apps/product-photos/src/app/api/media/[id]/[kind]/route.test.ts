import { describe, it, expect, vi, beforeEach } from "vitest";

const { findUnique, requireUser, readMedia } = vi.hoisted(() => {
  return {
    findUnique: vi.fn(),
    requireUser: vi.fn(),
    readMedia: vi.fn(),
  };
});

vi.mock("@/lib/db/client", () => ({ prisma: { generation: { findUnique } } }));
vi.mock("@/lib/auth/session", () => ({ requireUser }));
vi.mock("@/lib/storage/index", async (orig) => {
  const actual = await orig<typeof import("@/lib/storage/index")>();
  return { ...actual, readMedia };
});

import { GET } from "@/app/api/media/[id]/[kind]/route";

const ctx = (id: string, kind: string) => ({ params: Promise.resolve({ id, kind }) });
beforeEach(() => { requireUser.mockResolvedValue({ id: "u1", email: "a@b.com", name: null }); findUnique.mockReset(); readMedia.mockReset(); });

describe("GET /api/media/:id/:kind", () => {
  it("404s when the generation belongs to another user", async () => {
    findUnique.mockResolvedValue({ id: "g1", userId: "someone-else" });
    const res = await GET(new Request("http://x/api/media/g1/original"), ctx("g1", "original"));
    expect(res.status).toBe(404);
  });
  it("streams bytes for the owner", async () => {
    findUnique.mockResolvedValue({ id: "g1", userId: "u1" });
    readMedia.mockResolvedValue({ data: Buffer.from("PNGDATA"), contentType: "image/png" });
    const res = await GET(new Request("http://x/api/media/g1/generated"), ctx("g1", "generated"));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/png");
    expect(Buffer.from(await res.arrayBuffer()).toString()).toBe("PNGDATA");
  });
  it("adds a download disposition when ?download=1", async () => {
    findUnique.mockResolvedValue({ id: "g1", userId: "u1" });
    readMedia.mockResolvedValue({ data: Buffer.from("x"), contentType: "image/png" });
    const res = await GET(new Request("http://x/api/media/g1/generated?download=1"), ctx("g1", "generated"));
    expect(res.headers.get("content-disposition")).toContain("attachment");
  });
  it("streams reference-0 media for the owner", async () => {
    findUnique.mockResolvedValue({ id: "g1", userId: "u1" });
    readMedia.mockResolvedValue({ data: Buffer.from("JPG"), contentType: "image/jpeg" });
    const res = await GET(new Request("http://x/api/media/g1/reference-0"), ctx("g1", "reference-0"));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/jpeg");
    expect(Buffer.from(await res.arrayBuffer()).toString()).toBe("JPG");
  });
});
