import { describe, it, expect } from "vitest";
import { buildPrompt } from "@/lib/ai/prompt";

describe("buildPrompt", () => {
  it("always includes the product-preservation block", () => {
    const p = buildPrompt({ style: "studio", background: "clean" });
    expect(p).toMatch(/preserve the exact product identity/i);
    expect(p).toMatch(/preserve .*colors/i);
    expect(p).toMatch(/labels and packaging/i);
    expect(p).toMatch(/photorealistic/i);
  });
  it("adds a style-specific section", () => {
    expect(buildPrompt({ style: "studio", background: "clean" })).toMatch(/studio/i);
    expect(buildPrompt({ style: "lifestyle", background: "natural" })).toMatch(/scene|in use|environment/i);
    expect(buildPrompt({ style: "luxury", background: "premium" })).toMatch(/editorial|premium/i);
    expect(buildPrompt({ style: "minimal", background: "clean" })).toMatch(/negative space|clean|minimal/i);
  });
  it("appends additional instructions verbatim when present", () => {
    const p = buildPrompt({ style: "studio", background: "clean", instructions: "Place it on a marble table." });
    expect(p).toContain("Place it on a marble table.");
  });
  it("omits the instructions section when empty", () => {
    const p = buildPrompt({ style: "studio", background: "clean", instructions: "   " });
    expect(p).not.toMatch(/additional instructions/i);
  });
});
