import { describe, it, expect } from "vitest";
import { assertValidImage, MAX_UPLOAD_BYTES } from "@/lib/validation/upload";

describe("assertValidImage", () => {
  it("accepts a small png", () => {
    expect(assertValidImage({ type: "image/png", size: 1000 })).toEqual({ ok: true });
  });
  it("rejects a pdf", () => {
    expect(assertValidImage({ type: "application/pdf", size: 1000 })).toEqual({ ok: false, reason: "type" });
  });
  it("rejects an oversized file", () => {
    expect(assertValidImage({ type: "image/jpeg", size: MAX_UPLOAD_BYTES + 1 })).toEqual({ ok: false, reason: "size" });
  });
});
