import type { CreateJobInput, JobResult, ProductPhotoProvider } from "@/lib/ai/product-photo-provider";

export class KieProvider implements ProductPhotoProvider {
  private get key() {
    const k = process.env.KIE_API_KEY;
    if (!k) throw new Error("KIE_API_KEY is not set");
    return k;
  }
  private get base() {
    return process.env.KIE_BASE_URL ?? "https://api.kie.ai";
  }
  private get model() {
    return process.env.KIE_MODEL ?? "nano-banana-2";
  }
  private get resolution() {
    return process.env.KIE_RESOLUTION ?? "2K";
  }

  private async json(res: Response, label: string) {
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Kie ${label} failed: ${res.status} ${text.slice(0, 300)}`);
    }
    const body = (await res.json()) as { code?: number; msg?: string; data?: Record<string, unknown> };
    // Kie returns HTTP 200 with an error `code` (402 insufficient balance,
    // 422 moderation, …) in the envelope — treat those as failures.
    if (body.code != null && body.code !== 200) {
      throw new Error(`Kie ${label} failed: code ${body.code} ${(body.msg ?? "").slice(0, 300)}`);
    }
    return body;
  }

  async createJob({ imageUrls, prompt, aspectRatio }: CreateJobInput): Promise<{ jobId: string }> {
    const res = await fetch(`${this.base}/api/v1/jobs/createTask`, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        input: {
          prompt,
          image_input: imageUrls,
          aspect_ratio: aspectRatio,
          resolution: this.resolution,
          output_format: "png",
        },
      }),
    });
    const body = await this.json(res, "createTask");
    const jobId = body.data?.taskId as string | undefined;
    if (!jobId) throw new Error(`Kie createTask returned no taskId: ${JSON.stringify(body).slice(0, 300)}`);
    return { jobId };
  }

  async getJob(jobId: string): Promise<JobResult> {
    const res = await fetch(`${this.base}/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(jobId)}`, {
      headers: { Authorization: `Bearer ${this.key}` },
    });
    const body = await this.json(res, "recordInfo");
    const state = body.data?.state as string | undefined;
    if (state === "success") {
      const raw = body.data?.resultJson as string | undefined;
      let parsed: { resultUrls?: string[] } = {};
      if (raw) {
        try {
          parsed = JSON.parse(raw) as { resultUrls?: string[] };
        } catch {
          return { status: "failed", error: "invalid result" };
        }
      }
      const imageUrl = parsed.resultUrls?.[0];
      if (!imageUrl) return { status: "failed", error: "no result url" };
      return { status: "completed", imageUrl };
    }
    if (state === "fail") {
      return { status: "failed", error: (body.data?.failMsg as string) || "generation failed" };
    }
    if (state === "waiting" || state === "queuing" || state === "generating") {
      return { status: "pending" };
    }
    // Absent or unrecognised state — do NOT treat as pending, or the client would
    // poll forever against a job the provider will never advance.
    return { status: "failed", error: "unknown provider state" };
  }
}
