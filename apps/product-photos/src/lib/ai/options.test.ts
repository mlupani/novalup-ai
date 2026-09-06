import { describe, it, expect } from "vitest";
import { FORMATS, STYLES, BACKGROUNDS, formatToAspectRatio, isStyleId, isFormatId } from "@/lib/ai/options";

describe("options", () => {
  it("exposes the four formats mapped to Kie aspect ratios", () => {
    expect(FORMATS.map((f) => f.id)).toEqual(["1:1", "4:5", "9:16", "16:9"]);
    expect(FORMATS.every((f) => f.aspectRatio === f.id)).toBe(true);
    expect(formatToAspectRatio("9:16")).toBe("9:16");
    expect(formatToAspectRatio("bogus")).toBeNull();
  });
  it("lists the five styles and four backgrounds", () => {
    expect(STYLES).toEqual(["studio", "lifestyle", "luxury", "minimal", "social-media"]);
    expect(BACKGROUNDS).toEqual(["clean", "premium", "natural", "custom"]);
  });
  it("type guards reject unknown ids", () => {
    expect(isStyleId("studio")).toBe(true);
    expect(isStyleId("vaporwave")).toBe(false);
    expect(isFormatId("1:1")).toBe(true);
  });
});
