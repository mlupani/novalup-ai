export type FormatId = "1:1" | "4:5" | "9:16" | "16:9";
export type AspectRatio = FormatId;
export type StyleId = "studio" | "lifestyle" | "luxury" | "minimal" | "social-media";
export type BackgroundId = "clean" | "premium" | "natural" | "custom";

export const FORMATS = [
  { id: "1:1", aspectRatio: "1:1" },
  { id: "4:5", aspectRatio: "4:5" },
  { id: "9:16", aspectRatio: "9:16" },
  { id: "16:9", aspectRatio: "16:9" },
] as const satisfies ReadonlyArray<{ id: FormatId; aspectRatio: AspectRatio }>;

export const STYLES = ["studio", "lifestyle", "luxury", "minimal", "social-media"] as const;
export const BACKGROUNDS = ["clean", "premium", "natural", "custom"] as const;

export function formatToAspectRatio(id: string): AspectRatio | null {
  return FORMATS.find((f) => f.id === id)?.aspectRatio ?? null;
}

export const isFormatId = (v: string): v is FormatId => FORMATS.some((f) => f.id === v);
export const isStyleId = (v: string): v is StyleId => (STYLES as readonly string[]).includes(v);
export const isBackgroundId = (v: string): v is BackgroundId => (BACKGROUNDS as readonly string[]).includes(v);
