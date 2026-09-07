import { describe, it, expect } from "vitest";
import { signupSchema, generationInputSchema, feedbackSchema, batchInputSchema } from "@/lib/validation/schemas";
import { MAX_PHOTOS } from "@/lib/limits";

describe("signupSchema", () => {
  it("rejects mismatched passwords", () => {
    const r = signupSchema.safeParse({ name: "Ana", email: "a@b.com", password: "12345678", confirmPassword: "99999999" });
    expect(r.success).toBe(false);
  });
  it("accepts a valid signup", () => {
    const r = signupSchema.safeParse({ name: "Ana", email: "a@b.com", password: "12345678", confirmPassword: "12345678" });
    expect(r.success).toBe(true);
  });
});

describe("generationInputSchema", () => {
  it("rejects an unknown style", () => {
    expect(generationInputSchema.safeParse({ format: "1:1", style: "nope", background: "clean" }).success).toBe(false);
  });
  it("accepts a valid combination with optional instructions", () => {
    expect(generationInputSchema.safeParse({ format: "9:16", style: "luxury", background: "premium", instructions: "soft light" }).success).toBe(true);
  });
});

describe("feedbackSchema", () => {
  it("requires all four fields", () => {
    expect(feedbackSchema.safeParse({ name: "Ana", email: "a@b.com", thoughts: "", nextIdeas: "x" }).success).toBe(false);
  });
});

describe("batchInputSchema", () => {
  const ok = { format: "1:1", style: "studio", background: "clean" };
  it("rejects an empty photos array", () => {
    expect(batchInputSchema.safeParse({ photos: [] }).success).toBe(false);
  });
  it("rejects more than MAX_PHOTOS", () => {
    expect(batchInputSchema.safeParse({ photos: Array(MAX_PHOTOS + 1).fill(ok) }).success).toBe(false);
  });
  it("rejects an unknown style in any entry", () => {
    expect(batchInputSchema.safeParse({ photos: [ok, { ...ok, style: "nope" }] }).success).toBe(false);
  });
  it("accepts 1 and MAX_PHOTOS valid entries, instructions optional", () => {
    expect(batchInputSchema.safeParse({ photos: [ok] }).success).toBe(true);
    expect(batchInputSchema.safeParse({ photos: Array(MAX_PHOTOS).fill(ok), instructions: "soft light" }).success).toBe(true);
  });
});
