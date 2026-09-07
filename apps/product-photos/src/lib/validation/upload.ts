export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
// A blank `MAX_UPLOAD_MB=` parses to 0 (and an absent one to NaN) — fall back to
// the 10 MB default rather than rejecting every upload.
const rawMaxUploadMb = Number(process.env.MAX_UPLOAD_MB);
export const MAX_UPLOAD_MB = Number.isFinite(rawMaxUploadMb) && rawMaxUploadMb > 0 ? rawMaxUploadMb : 10;
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

export function assertValidImage(file: { type: string; size: number }):
  | { ok: true }
  | { ok: false; reason: "type" | "size" } {
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return { ok: false, reason: "type" };
  }
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, reason: "size" };
  return { ok: true };
}

export function contentTypeToExt(contentType: string): "jpg" | "png" | "webp" {
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  return "jpg";
}
