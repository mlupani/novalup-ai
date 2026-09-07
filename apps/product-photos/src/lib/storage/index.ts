import { LocalStorage } from "@/lib/storage/local";

export interface Storage {
  put(key: string, data: Buffer, contentType: string): Promise<{ url: string }>;
  read(key: string): Promise<{ data: Buffer; contentType: string }>;
}

export const storage: Storage = new LocalStorage(process.env.STORAGE_DIR ?? "./.data");

export function mediaKey(
  generationId: string,
  kind: "original" | "generated" | "reference-0" | "reference-1",
  ext: string,
): string {
  return `${generationId}/${kind}.${ext}`;
}

export function mediaApiUrl(generationId: string, kind: "original" | "generated" | "reference-0" | "reference-1"): string {
  return `/api/media/${generationId}/${kind}`;
}

const EXT_BY_KIND: Record<"original" | "generated" | "reference-0" | "reference-1", string[]> = {
  original: ["jpg", "jpeg", "png", "webp"],
  generated: ["png"],
  "reference-0": ["jpg", "jpeg", "png", "webp"],
  "reference-1": ["jpg", "jpeg", "png", "webp"],
};

export async function readMedia(
  generationId: string,
  kind: "original" | "generated" | "reference-0" | "reference-1",
): Promise<{ data: Buffer; contentType: string } | null> {
  // Defense in depth: `generationId` reaches `join(root, key)` — reject anything
  // that is not a bare cuid so a crafted id can never traverse out of the root.
  if (!/^[a-z0-9]+$/i.test(generationId)) return null;
  for (const ext of EXT_BY_KIND[kind]) {
    try {
      return await storage.read(mediaKey(generationId, kind, ext));
    } catch {
      /* try next extension */
    }
  }
  return null;
}
