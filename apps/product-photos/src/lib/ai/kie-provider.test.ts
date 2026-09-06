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
  it("uploads the image then creates a task and returns the taskId", async () => {
    const fetchMock = vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(jsonResponse({ success: true, data: { downloadUrl: "https://cdn/x.png" } }))
      .mockResolvedValueOnce(jsonResponse({ code: 200, data: { taskId: "task_123" } }));

    const p = new KieProvider();
    const { jobId } = await p.createJob({
      image: Buffer.from("img"),
      fileName: "gen1-original.png",
      contentType: "image/png",
      prompt: "make it nice",
      aspectRatio: "1:1",
    });

    expect(jobId).toBe("task_123");
    const createCall = fetchMock.mock.calls[1];
    expect(String(createCall[0])).toContain("/api/v1/jobs/createTask");
    const bodySent = JSON.parse((createCall[1] as RequestInit).body as string);
    expect(bodySent.model).toBe("nano-banana-2");
    expect(bodySent.input.image_input).toEqual(["https://cdn/x.png"]);
    expect(bodySent.input.aspect_ratio).toBe("1:1");
  });

  it("throws when KIE_API_KEY is missing", async () => {
    delete process.env.KIE_API_KEY;
    const p = new KieProvider();
    await expect(
      p.createJob({ image: Buffer.from("i"), fileName: "a.png", contentType: "image/png", prompt: "p", aspectRatio: "1:1" }),
    ).rejects.toThrow(/KIE_API_KEY/);
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
});
