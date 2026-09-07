import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { LocalStorage } from "@/lib/storage/local";

let dir: string;
beforeEach(async () => { dir = await mkdtemp(join(tmpdir(), "pp-store-")); });
afterEach(async () => { await rm(dir, { recursive: true, force: true }); });

describe("LocalStorage", () => {
  it("round-trips a buffer with its content type", async () => {
    const s = new LocalStorage(dir);
    await s.put("gen1/original.png", Buffer.from("hello"), "image/png");
    const got = await s.read("gen1/original.png");
    expect(got.data.toString()).toBe("hello");
    expect(got.contentType).toBe("image/png");
  });
  it("creates nested directories", async () => {
    const s = new LocalStorage(dir);
    await expect(s.put("a/b/c/x.jpg", Buffer.from("x"), "image/jpeg")).resolves.toBeTruthy();
  });
  it("read throws for a missing key", async () => {
    const s = new LocalStorage(dir);
    await expect(s.read("missing/x.png")).rejects.toThrow();
  });
  it("round-trips a reference-0 media", async () => {
    const s = new LocalStorage(dir);
    await s.put("gen1/reference-0.jpg", Buffer.from("ref"), "image/jpeg");
    const got = await s.read("gen1/reference-0.jpg");
    expect(got.data.toString()).toBe("ref");
    expect(got.contentType).toBe("image/jpeg");
  });
});
