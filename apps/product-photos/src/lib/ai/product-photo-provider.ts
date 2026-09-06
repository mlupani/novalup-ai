import { KieProvider } from "@/lib/ai/kie-provider";

export type JobResult =
  | { status: "pending" }
  | { status: "completed"; imageUrl: string }
  | { status: "failed"; error: string };

export interface CreateJobInput {
  image: Buffer;
  fileName: string;
  contentType: string;
  prompt: string;
  aspectRatio: "1:1" | "4:5" | "9:16" | "16:9";
}

export interface ProductPhotoProvider {
  createJob(input: CreateJobInput): Promise<{ jobId: string }>;
  getJob(jobId: string): Promise<JobResult>;
}

export const provider: ProductPhotoProvider = new KieProvider();
