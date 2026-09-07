import { describe, it, expect } from "vitest";
import { toDownloadUrl } from "@/lib/storage/download";

describe("toDownloadUrl", () => {
  it("injects fl_attachment after /upload/ so Cloudinary serves the file as an attachment", () => {
    expect(
      toDownloadUrl("https://res.cloudinary.com/duz1soadb/image/upload/v1720000000/product-photos/abc.png"),
    ).toBe(
      "https://res.cloudinary.com/duz1soadb/image/upload/fl_attachment/v1720000000/product-photos/abc.png",
    );
  });

  it("is idempotent when fl_attachment is already present", () => {
    const url = "https://res.cloudinary.com/duz1soadb/image/upload/fl_attachment/v1/product-photos/abc.png";
    expect(toDownloadUrl(url)).toBe(url);
  });

  it("returns a non-Cloudinary url unchanged", () => {
    expect(toDownloadUrl("/api/media/g1/generated")).toBe("/api/media/g1/generated");
  });
});
