import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { KieProvider } from "@/lib/ai/kie-provider";

const OLD = { ...process.env };
beforeEach(() => {
  process.env.KIE_API_KEY = "test-key";
  process.env.KIE_BASE_URL = "https://api.kie.ai";
  process.env.KIE_UPLOAD_URL = "https://up.example/api/file-stream-upload";
});
afterEach(() => {
  process.env = { ...OLD };
  vi.restoreAllMocks();
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

describe("KieProvider.createJob", () => {
  it("throws when KIE_API_KEY is missing", async () => {
    delete process.env.KIE_API_KEY;
    const p = new KieProvider();
    await expect(
      p.createJob({ imageUrls: ["https://cdn/a.png"], prompt: "p", aspectRatio: "1:1" }),
    ).rejects.toThrow(/KIE_API_KEY/);
  });
});

describe("KieProvider.uploadImages", () => {
  it("uploads each image and returns urls in order", async () => {
    const fetchMock = vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(jsonResponse({ success: true, data: { downloadUrl: "https://cdn/a.png" } }))
      .mockResolvedValueOnce(jsonResponse({ success: true, data: { downloadUrl: "https://cdn/b.png" } }));
    const urls = await new KieProvider().uploadImages([
      { data: Buffer.from("a"), contentType: "image/png", fileName: "a.png" },
      { data: Buffer.from("b"), contentType: "image/png", fileName: "b.png" },
    ]);
    expect(urls).toEqual(["https://cdn/a.png", "https://cdn/b.png"]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe("KieProvider.createJob (imageUrls)", () => {
  it("sends image_input as the given urls and does not upload", async () => {
    const fetchMock = vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(jsonResponse({ code: 200, data: { taskId: "t1" } }));
    const { jobId } = await new KieProvider().createJob({
      imageUrls: ["https://cdn/a.png", "https://cdn/b.png"],
      prompt: "p", aspectRatio: "4:5",
    });
    expect(jobId).toBe("t1");
    expect(fetchMock).toHaveBeenCalledTimes(1); // no upload
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body.input.image_input).toEqual(["https://cdn/a.png", "https://cdn/b.png"]);
    expect(body.model).toBe("nano-banana-2");
  });
});

describe("KieProvider.getJob", () => {
  it("maps queuing/generating to pending", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(jsonResponse({ code: 200, data: { state: "generating" } }));
    expect(await new KieProvider().getJob("t1")).toEqual({ status: "pending" });
  });
  it("maps success to completed with the first result url", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      jsonResponse({ code: 200, data: { state: "success", resultJson: JSON.stringify({ resultUrls: ["https://cdn/out.png"] }) } }),
    );
    expect(await new KieProvider().getJob("t1")).toEqual({ status: "completed", imageUrl: "https://cdn/out.png" });
  });
  it("maps fail to failed with the message", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      jsonResponse({ code: 200, data: { state: "fail", failMsg: "content blocked" } }),
    );
    expect(await new KieProvider().getJob("t1")).toEqual({ status: "failed", error: "content blocked" });
  });
  it("maps malformed resultJson to failed, not a throw", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      jsonResponse({ code: 200, data: { state: "success", resultJson: "not json" } }),
    );
    expect(await new KieProvider().getJob("t1")).toEqual({ status: "failed", error: "invalid result" });
  });
  it("maps an absent/unknown state to failed, not pending", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(jsonResponse({ code: 200, data: {} }));
    expect(await new KieProvider().getJob("t1")).toEqual({ status: "failed", error: "unknown provider state" });
  });
  it("throws when the envelope carries a non-200 code (e.g. 402 insufficient balance)", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      jsonResponse({ code: 402, msg: "insufficient balance", data: {} }),
    );
    await expect(new KieProvider().getJob("t1")).rejects.toThrow(/402|insufficient balance/);
  });
});
