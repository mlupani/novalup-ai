import { describe, it, expect } from "vitest";
import { signupSchema, feedbackSchema, batchInputSchema } from "@/lib/validation/schemas";
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

describe("feedbackSchema", () => {
  it("accepts a non-empty message", () => {
    expect(feedbackSchema.safeParse({ message: "me encantó" }).success).toBe(true);
  });
  it("rejects a missing or whitespace-only message", () => {
    expect(feedbackSchema.safeParse({}).success).toBe(false);
    expect(feedbackSchema.safeParse({ message: "   " }).success).toBe(false);
  });
  it("rejects a message longer than 2000 characters", () => {
    expect(feedbackSchema.safeParse({ message: "x".repeat(2001) }).success).toBe(false);
  });
  it("ignores any extra fields such as a client-supplied email", () => {
    const r = feedbackSchema.safeParse({ message: "hola", email: "spoof@evil.com" });
    expect(r.success).toBe(true);
    expect(r.success && r.data).toEqual({ message: "hola" });
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
