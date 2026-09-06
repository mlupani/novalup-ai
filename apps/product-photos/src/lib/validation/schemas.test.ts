import { describe, it, expect } from "vitest";
import { signupSchema, generationInputSchema, feedbackSchema } from "@/lib/validation/schemas";

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
