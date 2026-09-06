import { LocalStorage } from "@/lib/storage/local";

export interface Storage {
  put(key: string, data: Buffer, contentType: string): Promise<{ url: string }>;
  read(key: string): Promise<{ data: Buffer; contentType: string }>;
}

export const storage: Storage = new LocalStorage(process.env.STORAGE_DIR ?? "./.data");

export function mediaKey(
  generationId: string,
  kind: "original" | "generated",
  ext: string,
): string {
  return `${generationId}/${kind}.${ext}`;
}

export function mediaApiUrl(generationId: string, kind: "original" | "generated"): string {
  return `/api/media/${generationId}/${kind}`;
}
