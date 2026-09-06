import { describe, it, expect } from "vitest";
import copy from "@/content/copy";

describe("copy", () => {
  it("formats credit labels with the given number", () => {
    expect(copy.credits.freeLabel(3)).toBe("3 créditos gratis");
    expect(copy.credits.remainingLabel(2)).toBe("2 créditos restantes");
  });
  it("formats the credit-used line with the remaining count", () => {
    expect(copy.tool.creditUsed(1)).toContain("Te quedan 1");
  });
});
