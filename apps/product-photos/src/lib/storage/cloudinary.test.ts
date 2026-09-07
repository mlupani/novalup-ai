import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createHash } from "node:crypto";
import { uploadImage, uploadImages } from "@/lib/storage/cloudinary";

const OLD = { ...process.env };
beforeEach(() => {
  process.env.CLOUDINARY_CLOUD_NAME = "duz1soadb";
  process.env.CLOUDINARY_API_KEY = "111222333";
  process.env.CLOUDINARY_API_SECRET = "s3cr3t";
  delete process.env.CLOUDINARY_FOLDER;
});
afterEach(() => {
  process.env = { ...OLD };
  vi.restoreAllMocks();
});

function okResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

describe("uploadImage", () => {
  it("posts a signed multipart upload to the cloud's image/upload endpoint and returns secure_url", async () => {
    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValue(
      okResponse({ secure_url: "https://res.cloudinary.com/duz1soadb/image/upload/v1/product-photos/abc.png", public_id: "product-photos/abc" }),
    );

    const result = await uploadImage(Buffer.from("PNGBYTES"), "image/png");

    expect(result).toEqual({ url: "https://res.cloudinary.com/duz1soadb/image/upload/v1/product-photos/abc.png" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.cloudinary.com/v1_1/duz1soadb/image/upload");
    expect(init.method).toBe("POST");
    const form = init.body as FormData;
    expect(form.get("api_key")).toBe("111222333");
    expect(form.get("folder")).toBe("product-photos");
    expect(form.get("file")).toBeInstanceOf(Blob);
    expect(typeof form.get("timestamp")).toBe("string");
    expect(typeof form.get("signature")).toBe("string");
  });

  it("signs the sorted params with sha1(params + api_secret)", async () => {
    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValue(okResponse({ secure_url: "https://x/y.png" }));

    await uploadImage(Buffer.from("x"), "image/webp");

    const form = (fetchMock.mock.calls[0][1] as RequestInit).body as FormData;
    const timestamp = form.get("timestamp") as string;
    const expected = createHash("sha1")
      .update(`folder=product-photos&timestamp=${timestamp}s3cr3t`)
      .digest("hex");
    expect(form.get("signature")).toBe(expected);
  });

  it("honours CLOUDINARY_FOLDER", async () => {
    process.env.CLOUDINARY_FOLDER = "product-photos/staging";
    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValue(okResponse({ secure_url: "https://x/y.png" }));

    await uploadImage(Buffer.from("x"), "image/png");

    const form = (fetchMock.mock.calls[0][1] as RequestInit).body as FormData;
    expect(form.get("folder")).toBe("product-photos/staging");
  });

  it("throws when CLOUDINARY_API_KEY is missing", async () => {
    delete process.env.CLOUDINARY_API_KEY;
    await expect(uploadImage(Buffer.from("x"), "image/png")).rejects.toThrow(/CLOUDINARY/);
  });

  it("throws when Cloudinary responds with a non-2xx status", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      okResponse({ error: { message: "Invalid signature" } }, 401),
    );
    await expect(uploadImage(Buffer.from("x"), "image/png")).rejects.toThrow(/Cloudinary upload failed/);
  });

  it("throws when the response carries no secure_url", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(okResponse({ public_id: "product-photos/abc" }));
    await expect(uploadImage(Buffer.from("x"), "image/png")).rejects.toThrow(/secure_url/);
  });
});

describe("uploadImages", () => {
  it("uploads each image and returns the urls in input order", async () => {
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(okResponse({ secure_url: "https://cdn/a.png" }))
      .mockResolvedValueOnce(okResponse({ secure_url: "https://cdn/b.jpg" }));

    const urls = await uploadImages([
      { data: Buffer.from("a"), contentType: "image/png" },
      { data: Buffer.from("b"), contentType: "image/jpeg" },
    ]);

    expect(urls).toEqual(["https://cdn/a.png", "https://cdn/b.jpg"]);
  });
});
