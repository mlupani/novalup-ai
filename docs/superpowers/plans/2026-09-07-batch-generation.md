# Batch Generation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a user generate 1–4 output photos in one request — each with its own format/style/background — from 1–2 shared reference images and one shared instructions field, with the batch blocked unless `credits >= N`.

**Architecture:** Every request becomes a "batch" (count 1 = batch of one; the single-photo path is removed). `POST /api/generations` takes 1–2 reference images + a `photos[]` array + shared `instructions`, creates N independent `Generation` rows, uploads the references to Kie once, kicks off the N Kie tasks in parallel (`Promise.allSettled`), and returns `{ ids }`. The client polls all ids and renders a results grid. `GET /api/generations/:id`, `poll.ts`, auth, Docker, and the `User` model are unchanged.

**Tech Stack:** Same as the MVP — Next.js 16 App Router, TypeScript, Tailwind v3, Prisma 7 (`prisma-client` generator, `@prisma/adapter-pg`), Vitest, pnpm workspaces.

**Spec:** `docs/superpowers/specs/2026-09-07-batch-generation-design.md` — read it alongside this plan. It also builds on `docs/superpowers/specs/2026-09-06-product-photos-mvp-design.md`.

## Global Constraints

- **Scope:** all changes are inside `apps/product-photos`. Do NOT touch `apps/web`, `packages/brand`, `src/lib/auth/**`, the `User` model, Docker config, or `GET /api/generations/[id]/route.ts` / `src/lib/generations/poll.ts` (poll is already batch-safe — each id is claimed once).
- **Prisma import path:** `import { prisma } from "@/lib/db/client"`; types/enums from `import { ... } from "@/generated/prisma/client"`. If typecheck reports `@/generated/prisma` missing, run `pnpm --filter product-photos exec prisma generate` first.
- **Credit rule (unchanged):** a credit is consumed by exactly one successful generation, in the `poll.ts` transaction (`updateMany where {id,status:"pending"}` + consume only on `count===1`), never on failure. `createBatch` never decrements. The batch is gated `credits >= photos.length` **before** any row is created.
- **Out of credits:** `POST /api/generations` → `403 { code: "NO_CREDITS", needed, available }`. In-flight batch → `409 { code: "GENERATION_IN_PROGRESS" }`. Provider/infra total failure → `502 { code: "PROVIDER_ERROR" }`.
- **Resource authz:** the media route still returns 404 (not 403) on a foreign/missing generation; ownership is keyed on `generationId`.
- **Constants:** `MAX_PHOTOS = 4`, `MAX_REFERENCE_IMAGES = 2` — from `src/lib/limits.ts`, referenced everywhere, never hard-coded.
- **UI:** Spanish only; every user-facing string from `src/content/copy.ts` (no inline literals). Brand tokens only (`night*`, `accent*`, neutrals). `"use client"` on any component with hooks/handlers.
- **Tests:** follow the existing patterns — `vi.hoisted()` for mock fns, `// @vitest-environment jsdom` docblock for hook tests with real timers + a small `pollIntervalMs`, mocked `@/lib/db/client` / provider / storage. The suite is at 65 tests; it must stay green (minus renamed files) and grow.
- **Commit messages** end with:
  ```
  Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_019MqwHsHqF9KBb73q3SB7DX
  ```
- **Do NOT build** (reject scope creep): a `Batch` DB table, batch history screen, per-photo instructions, per-photo reference images, partial-batch generation when credits are short, single-tile regeneration, reference-image dedup across a batch's rows, >2 reference images.

---

## File Structure

| Path | Change |
|---|---|
| `src/lib/limits.ts` | **new** — `MAX_PHOTOS`, `MAX_REFERENCE_IMAGES` |
| `src/lib/ai/prompt.ts` | plural-safe wording ("the provided product image(s)") |
| `src/lib/ai/prompt.test.ts` | assertion tweak for the new wording |
| `src/content/copy.ts` | new `tool.*` + `errors.*` keys; `OptionValue`-related copy unchanged |
| `src/lib/storage/index.ts` | `kind` union + `EXT_BY_KIND` + `readMedia` gain `reference-0` / `reference-1` (keep `original` for now) |
| `src/lib/storage/local.test.ts` | round-trip a `reference-0` key |
| `src/app/api/media/[id]/[kind]/route.ts` | `KINDS` set gains `reference-0` / `reference-1` |
| `src/app/api/media/[id]/[kind]/route.test.ts` | a `reference-0` fetch case |
| `src/lib/validation/schemas.ts` | **add** `photoOptionSchema`, `batchInputSchema` (keep `generationInputSchema` until Task 5) |
| `src/lib/validation/schemas.test.ts` | `batchInputSchema` cases |
| `src/lib/ai/product-photo-provider.ts` | interface: **add** `uploadImages`, **change** `createJob` to `{ imageUrls, prompt, aspectRatio }` |
| `src/lib/ai/kie-provider.ts` | `uploadImages()` impl; `createJob` drops its own upload, uses `imageUrls` |
| `src/lib/ai/kie-provider.test.ts` | `uploadImages` + new `createJob` shape |
| `src/lib/generations/create.ts` | Task 4: adapt the one `createJob` call site. Task 5: rewrite → `createBatch` |
| `src/lib/generations/create.test.ts` → `createBatch.test.ts` | Task 5 rename + rewrite |
| `src/app/api/generations/route.ts` | Task 5: batch multipart handler |
| `src/app/api/generations/route.test.ts` | **new** (Task 5) |
| `prisma/schema.prisma` + `prisma/migrations/**` | Task 5: `originalImageUrl` → `referenceImageUrls String[]` + migration |
| `src/hooks/useGeneration.ts` → `src/hooks/useBatchGeneration.ts` | Task 6 rename + rewrite |
| `src/hooks/useGeneration.test.ts` → `src/hooks/useBatchGeneration.test.ts` | Task 6 rename + rewrite |
| `src/components/tool/Uploader.tsx` | Task 6: `File[]`, max 2 |
| `src/components/tool/PhotoCountSelector.tsx` | **new** (Task 6) |
| `src/components/tool/OptionPicker.tsx` | Task 6: drop the instructions textarea; add `title` prop; `OptionValue` loses `instructions` |
| `src/components/tool/PhotoOptionsList.tsx` | **new** (Task 6) |
| `src/components/tool/GeneratePanel.tsx` | Task 6: `generateN` label + credits-needed line |
| `src/components/tool/ResultsGrid.tsx` | **new** (Task 6) |
| `src/components/tool/ResultCard.tsx` | Task 6: **deleted** |
| `src/components/tool/ProductPhotoTool.tsx` | Task 6: rewired for batch |

`src/lib/generations/poll.ts` + `poll.test.ts`, `src/app/api/generations/[id]/route.ts`, `src/lib/credits/**`, `src/lib/validation/upload.ts` — unchanged.

---

## Task 1: Product limits, prompt wording, copy strings

**Files:**
- Create: `src/lib/limits.ts`
- Modify: `src/lib/ai/prompt.ts`, `src/lib/ai/prompt.test.ts`, `src/content/copy.ts`

**Interfaces:**
- Produces `@/lib/limits` → `export const MAX_PHOTOS = 4;` `export const MAX_REFERENCE_IMAGES = 2;`
- Produces new `copy` keys (all under the existing `tool` / `errors` groups — do not restructure `copy.ts`):
  - `tool.photoCountLabel: "Cantidad de fotos"`
  - `tool.photoCountOption: (n: number) => n === 1 ? "1 foto" : \`${n} fotos\``
  - `tool.photoNLabel: (i: number) => \`Foto ${i}\``  (i is 1-based)
  - `tool.generateN: (n: number) => n === 1 ? "Generar foto" : \`Generar ${n} fotos\``
  - `tool.creditsNeeded: (needed: number, available: number) => \`Necesitás ${needed} ${needed === 1 ? "crédito" : "créditos"} · tenés ${available}\``
  - `tool.batchSummary: (done: number, remaining: number) => \`${done} ${done === 1 ? "foto" : "fotos"} · ${done} ${done === 1 ? "crédito usado" : "créditos usados"} · te quedan ${remaining}\``
  - `tool.addReference: "Agregá otra referencia"`
  - `tool.creatingBatch: (done: number, total: number) => \`Creando ${total} fotos… ${done} de ${total} listas\``
  - `errors.tooManyImages: (max: number) => \`Podés subir hasta ${max} imágenes de referencia.\``
  - Update `tool.referencesHint` (currently the single-image hint text) → mention "hasta 2 imágenes de referencia". Keep `tool.uploadHint` / `tool.uploadFormats` / `tool.changeImage` present (still used).
- Consumes: nothing.

- [ ] **Step 1: Create `src/lib/limits.ts`**

```ts
export const MAX_PHOTOS = 4;
export const MAX_REFERENCE_IMAGES = 2;
```

- [ ] **Step 2: Update the prompt base wording**

In `src/lib/ai/prompt.ts`, the `BASE` string's first sentence currently reads "Create a professional commercial product photograph from the provided product image." Change "the provided product image" → "the provided product image(s)". Nothing else changes.

- [ ] **Step 3: Update `prompt.test.ts`**

The existing test asserts `/preserve the exact product identity/i` etc. — those still pass. If any assertion matches the literal "provided product image" without the `(s)`, relax it to `/provided product image/i` (matches both). Run: `pnpm --filter product-photos test -- prompt` → PASS.

- [ ] **Step 4: Add the copy keys**

Add the keys above to `src/content/copy.ts` in the `tool` and `errors` groups. Match the existing `as const` style. The formatter functions follow the same pattern as the existing `copy.tool.creditUsed(n)` / `copy.credits.freeLabel(n)`.

- [ ] **Step 5: Verify + commit**

Run: `pnpm --filter product-photos test && pnpm --filter product-photos typecheck && pnpm --filter product-photos lint` → all clean.

```bash
git add apps/product-photos/src/lib/limits.ts apps/product-photos/src/lib/ai/prompt.ts apps/product-photos/src/lib/ai/prompt.test.ts apps/product-photos/src/content/copy.ts
git commit -m "Add batch limits, plural prompt wording, batch copy strings"
```

---

## Task 2: Storage + media route — reference-0 / reference-1 kinds

**Files:**
- Modify: `src/lib/storage/index.ts`, `src/lib/storage/local.test.ts`
- Modify: `src/app/api/media/[id]/[kind]/route.ts`, `src/app/api/media/[id]/[kind]/route.test.ts`

**Interfaces:**
- `mediaKey(generationId: string, kind: MediaKind, ext: string): string` where `MediaKind = "original" | "generated" | "reference-0" | "reference-1"` (keep `"original"` — it is removed in a later cleanup once nothing references it; adding the two new values is purely additive here).
- `readMedia(generationId, kind: "original" | "generated" | "reference-0" | "reference-1"): Promise<{ data: Buffer; contentType: string } | null>` — `EXT_BY_KIND` gains `"reference-0": ["jpg","jpeg","png","webp"]` and `"reference-1": ["jpg","jpeg","png","webp"]`.
- `mediaApiUrl(generationId, kind)` — same signature widening.
- Media route `KINDS` set → `new Set(["original", "generated", "reference-0", "reference-1"])`.

- [ ] **Step 1: Widen the storage kind types + maps**

In `src/lib/storage/index.ts`: widen the `kind` parameter type on `mediaKey` / `mediaApiUrl` / `readMedia` to include `"reference-0"` and `"reference-1"`. Add both to `EXT_BY_KIND` with the 4-extension list. `readMedia`'s loop is unchanged (it iterates `EXT_BY_KIND[kind]`).

- [ ] **Step 2: Storage round-trip test**

In `src/lib/storage/local.test.ts`, add a case: `put("gen1/reference-0.jpg", Buffer.from("ref"), "image/jpeg")` then `read` → bytes + content type match. Run: `pnpm --filter product-photos test -- storage` → PASS.

- [ ] **Step 3: Widen the media route**

In `src/app/api/media/[id]/[kind]/route.ts`: add `"reference-0"` and `"reference-1"` to the `KINDS` set. The `kind as ...` cast and everything else are unchanged.

- [ ] **Step 4: Media route test**

In `route.test.ts`, add a case: owner requests `reference-0` → `readMedia` mocked to return jpeg bytes → 200 + `image/jpeg` + the bytes. Run: `pnpm --filter product-photos test -- media` → PASS.

- [ ] **Step 5: Verify + commit**

Run: `pnpm --filter product-photos test && pnpm --filter product-photos typecheck && pnpm --filter product-photos lint`

```bash
git add apps/product-photos/src/lib/storage "apps/product-photos/src/app/api/media"
git commit -m "Add reference-0 / reference-1 media kinds"
```

---

## Task 3: Validation — batch schemas

**Files:**
- Modify: `src/lib/validation/schemas.ts`, `src/lib/validation/schemas.test.ts`

**Interfaces:**
- **Add** (do NOT remove `generationInputSchema` yet — `create.ts` + `route.ts` still import it; removed in Task 5):
  ```ts
  export const photoOptionSchema = z.object({
    format: z.string().refine(isFormatId, "invalid_format"),
    style: z.string().refine(isStyleId, "invalid_style"),
    background: z.string().refine(isBackgroundId, "invalid_background"),
  });

  export const batchInputSchema = z.object({
    photos: z.array(photoOptionSchema).min(1).max(MAX_PHOTOS),
    instructions: z.string().trim().max(1000).optional(),
  });

  export type PhotoOption = z.infer<typeof photoOptionSchema>;
  export type BatchInput = z.infer<typeof batchInputSchema>;
  ```
- Consumes: `MAX_PHOTOS` from `@/lib/limits`; the catalog guards from `@/lib/ai/options`.

- [ ] **Step 1: Write the failing test**

In `src/lib/validation/schemas.test.ts` add:

```ts
import { batchInputSchema } from "@/lib/validation/schemas";
import { MAX_PHOTOS } from "@/lib/limits";

describe("batchInputSchema", () => {
  const ok = { format: "1:1", style: "studio", background: "clean" };
  it("rejects an empty photos array", () => {
    expect(batchInputSchema.safeParse({ photos: [] }).success).toBe(false);
  });
  it("rejects more than MAX_PHOTOS", () => {
    expect(batchInputSchema.safeParse({ photos: Array(MAX_PHOTOS + 1).fill(ok) }).success).toBe(false);
  });
  it("rejects an unknown style in any entry", () => {
    expect(batchInputSchema.safeParse({ photos: [ok, { ...ok, style: "nope" }] }).success).toBe(false);
  });
  it("accepts 1 and MAX_PHOTOS valid entries, instructions optional", () => {
    expect(batchInputSchema.safeParse({ photos: [ok] }).success).toBe(true);
    expect(batchInputSchema.safeParse({ photos: Array(MAX_PHOTOS).fill(ok), instructions: "soft light" }).success).toBe(true);
  });
});
```

- [ ] **Step 2: Run → FAIL.** `pnpm --filter product-photos test -- schemas`

- [ ] **Step 3: Add the schemas** to `src/lib/validation/schemas.ts` (code above). Import `MAX_PHOTOS`.

- [ ] **Step 4: Run → PASS.** `pnpm --filter product-photos test -- schemas`. Then full `pnpm --filter product-photos test && typecheck && lint`.

- [ ] **Step 5: Commit**

```bash
git add apps/product-photos/src/lib/validation/schemas.ts apps/product-photos/src/lib/validation/schemas.test.ts
git commit -m "Add photoOptionSchema and batchInputSchema"
```

---

## Task 4: AI provider — split upload from createJob

**Files:**
- Modify: `src/lib/ai/product-photo-provider.ts`, `src/lib/ai/kie-provider.ts`, `src/lib/ai/kie-provider.test.ts`
- Modify: `src/lib/generations/create.ts` (adapt the one call site — still single-photo)

**Interfaces:**
- `product-photo-provider.ts`:
  ```ts
  export interface UploadImageInput { data: Buffer; contentType: string; fileName: string; }
  export interface CreateJobInput {
    imageUrls: string[];               // 1–2 provider-hosted URLs
    prompt: string;
    aspectRatio: "1:1" | "4:5" | "9:16" | "16:9";
  }
  export interface ProductPhotoProvider {
    uploadImages(images: UploadImageInput[]): Promise<string[]>;
    createJob(input: CreateJobInput): Promise<{ jobId: string }>;
    getJob(jobId: string): Promise<JobResult>;
  }
  export const provider: ProductPhotoProvider; // KieProvider singleton — unchanged export
  ```
  `JobResult` is unchanged.
- `kie-provider.ts`:
  - `uploadImages(images)` — `Promise.all(images.map(img => this.uploadOne(img)))`, returns URLs in input order. `uploadOne` is the current `uploadImage` body (multipart POST to `KIE_UPLOAD_URL`, read `data.downloadUrl ?? data.fileUrl`, throw if absent). Rename the private method to `uploadOne` and have it take `UploadImageInput`.
  - `createJob({ imageUrls, prompt, aspectRatio })` — no upload; `POST ${base}/api/v1/jobs/createTask` with `input.image_input = imageUrls`, everything else unchanged (model, resolution, `output_format: "png"`, the body-`code !== 200` throw, `taskId` extraction).
  - `getJob` — unchanged.
- `create.ts` (interim single-photo shape): replace the `provider.createJob({ image, fileName, contentType, prompt, aspectRatio })` call with:
  ```ts
  const [imageUrl] = await provider.uploadImages([{ data: image, contentType, fileName: `${generation.id}-reference-0.${ext}` }]);
  const { jobId } = await provider.createJob({ imageUrls: [imageUrl], prompt, aspectRatio });
  ```
  (Keep `create.ts` otherwise as-is; Task 5 rewrites it fully. This step only keeps typecheck green.)

- [ ] **Step 1: Write the failing tests** in `src/lib/ai/kie-provider.test.ts`

```ts
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
```

Keep the existing `getJob` mapping tests. Delete/replace the old `createJob` test that expected an upload-then-create sequence.

- [ ] **Step 2: Run → FAIL.** `pnpm --filter product-photos test -- kie-provider`

- [ ] **Step 3: Update `product-photo-provider.ts`** — the interface + types above. `JobResult` and the `provider` export line stay.

- [ ] **Step 4: Update `kie-provider.ts`** — rename `uploadImage` → `uploadOne(input: UploadImageInput)`, add `uploadImages`, strip the upload step out of `createJob` and take `imageUrls`.

- [ ] **Step 5: Adapt `create.ts`** — the interim two-line change above so it compiles.

- [ ] **Step 6: Run → PASS + full check.** `pnpm --filter product-photos test && typecheck && lint` — all green (the existing `create.test.ts` still passes since the single-photo behavior is preserved; if its provider mock asserted the old `createJob({image})` shape, update that mock to `uploadImages` + `createJob({imageUrls})`).

- [ ] **Step 7: Commit**

```bash
git add apps/product-photos/src/lib/ai apps/product-photos/src/lib/generations/create.ts apps/product-photos/src/lib/generations/create.test.ts
git commit -m "Split ProductPhotoProvider into uploadImages + createJob(imageUrls)"
```

---

## Task 5: Schema migration + createBatch + batch API route

**Files:**
- Modify: `prisma/schema.prisma`; Create: `prisma/migrations/<ts>_batch_generation/migration.sql` (via `prisma migrate dev`)
- Rewrite: `src/lib/generations/create.ts`; Rename+rewrite: `src/lib/generations/create.test.ts` → `createBatch.test.ts`
- Rewrite: `src/app/api/generations/route.ts`; Create: `src/app/api/generations/route.test.ts`
- Modify: `src/lib/validation/schemas.ts` (remove `generationInputSchema` + `GenerationInput`), `src/lib/validation/schemas.test.ts` (drop its cases)

**Interfaces:**
- Prisma `Generation`: `originalImageUrl String` **removed**; `referenceImageUrls String[] @default([])` **added**. All other fields/indexes unchanged.
- `src/lib/generations/create.ts` exports `createBatch(args)` (signature exactly as spec §7):
  ```ts
  export async function createBatch(args: {
    userId: string;
    referenceImages: { data: Buffer; contentType: string }[];        // length 1–MAX_REFERENCE_IMAGES
    photos: { format: FormatId; style: StyleId; background: BackgroundId }[]; // length 1–MAX_PHOTOS
    instructions?: string;
  }): Promise<
    | { ok: true; ids: string[] }
    | { ok: false; code: "NO_CREDITS"; needed: number; available: number }
    | { ok: false; code: "GENERATION_IN_PROGRESS" }
    | { ok: false; code: "PROVIDER_ERROR" }
  >;
  ```
- `POST /api/generations` — `multipart/form-data`: `referenceImages` (1–2 File entries, repeated name), `photos` (JSON string), `instructions` (optional). Responses: `201 {ids}` / `403 {code:"NO_CREDITS",needed,available}` / `409 {code:"GENERATION_IN_PROGRESS"}` / `422 {error:...}` / `502 {code:"PROVIDER_ERROR"}`.
- Consumes: `MAX_PHOTOS`/`MAX_REFERENCE_IMAGES`, `batchInputSchema`, `assertValidImage`/`contentTypeToExt`, `getCredits`, `buildPrompt`, `formatToAspectRatio`, `provider.uploadImages`/`provider.createJob`, `prisma`, `storage`/`mediaKey`/`mediaApiUrl`, `requireUser`.

- [ ] **Step 1: Schema + migration**

Edit `prisma/schema.prisma`: on `Generation`, delete the `originalImageUrl String` line, add `referenceImageUrls String[] @default([])`. Then (Docker is running):

```bash
docker run --rm -d --name pp-mig -e POSTGRES_USER=novalup -e POSTGRES_PASSWORD=novalup -e POSTGRES_DB=product_photos -p 5432:5432 postgres:16-alpine
# ensure apps/product-photos/.env has DATABASE_URL=postgresql://novalup:novalup@localhost:5432/product_photos
pnpm --filter product-photos exec prisma migrate dev --name batch_generation
docker rm -f pp-mig
```

Confirm the generated `migration.sql` does `ALTER TABLE "Generation" DROP COLUMN "originalImageUrl"` and `ADD COLUMN "referenceImageUrls" TEXT[] ... DEFAULT ARRAY[]::TEXT[]`. Commit the migration folder.

- [ ] **Step 2: Write the failing `createBatch.test.ts`**

`git mv apps/product-photos/src/lib/generations/create.test.ts apps/product-photos/src/lib/generations/createBatch.test.ts`, then replace its body. Mocks: `@/lib/db/client` (`prisma.generation.{create,update,findFirst,updateMany}`), `@/lib/credits/service` (`getCredits`), `@/lib/storage/index` (`storage.put`, `mediaKey`, `mediaApiUrl`), `@/lib/ai/product-photo-provider` (`provider.uploadImages`, `provider.createJob`). Leave `prompt` / `options` / `limits` real.

```ts
const baseArgs = {
  userId: "u1",
  referenceImages: [{ data: Buffer.from("r0"), contentType: "image/png" }],
  photos: [
    { format: "1:1", style: "studio", background: "clean" },
    { format: "4:5", style: "luxury", background: "premium" },
    { format: "9:16", style: "minimal", background: "natural" },
  ] as const,
};

// beforeEach: generation.findFirst -> null; generation.updateMany -> {count:0};
// generation.create -> ({ id: `g${n}` }) incrementing; generation.update -> {};
// getCredits -> 3; provider.uploadImages -> ["https://cdn/r0.png"];
// provider.createJob -> ({ jobId: "task" });

it("blocks with GENERATION_IN_PROGRESS when a pending row exists", async () => {
  generation.findFirst.mockResolvedValue({ id: "old" });
  expect(await createBatch(baseArgs)).toEqual({ ok: false, code: "GENERATION_IN_PROGRESS" });
  expect(generation.create).not.toHaveBeenCalled();
});

it("reaps stale pendings before the guard", async () => {
  await createBatch(baseArgs);
  expect(generation.updateMany).toHaveBeenCalledWith(expect.objectContaining({
    where: expect.objectContaining({ userId: "u1", status: "pending", createdAt: expect.any(Object) }),
    data: { status: "failed", error: "timeout" },
  }));
  expect(generation.updateMany.mock.invocationCallOrder[0]).toBeLessThan(generation.findFirst.mock.invocationCallOrder[0]);
});

it("blocks with NO_CREDITS when credits < photos.length and creates no rows", async () => {
  vi.mocked(getCredits).mockResolvedValue(2);
  expect(await createBatch(baseArgs)).toEqual({ ok: false, code: "NO_CREDITS", needed: 3, available: 2 });
  expect(generation.create).not.toHaveBeenCalled();
  expect(provider.uploadImages).not.toHaveBeenCalled();
});

it("uploads references once, starts 3 jobs, returns 3 ids in order", async () => {
  const res = await createBatch(baseArgs);
  expect(res).toEqual({ ok: true, ids: ["g1", "g2", "g3"] });
  expect(provider.uploadImages).toHaveBeenCalledTimes(1);
  expect(provider.createJob).toHaveBeenCalledTimes(3);
  expect(generation.create).toHaveBeenCalledTimes(3);
});

it("one createJob failure fails only that row, still returns all ids", async () => {
  vi.mocked(provider.createJob)
    .mockResolvedValueOnce({ jobId: "t1" })
    .mockRejectedValueOnce(new Error("kie down"))
    .mockResolvedValueOnce({ jobId: "t3" });
  const res = await createBatch(baseArgs);
  expect(res.ok).toBe(true);
  expect((res as { ids: string[] }).ids).toHaveLength(3);
  expect(generation.update).toHaveBeenCalledWith(expect.objectContaining({
    data: expect.objectContaining({ status: "failed" }),
  }));
});
```

- [ ] **Step 3: Run → FAIL.** `pnpm --filter product-photos test -- createBatch`

- [ ] **Step 4: Rewrite `src/lib/generations/create.ts` as `createBatch`** per spec §7 (flow steps 1–6). Key points: reap → guard (no `createdAt`) → `getCredits` gate (`< photos.length`) → `provider.uploadImages` once → `Promise.allSettled` over N `startPhoto` units, each: `formatToAspectRatio` + `buildPrompt` + `prisma.generation.create` (with `referenceImageUrls: []`) then a `try` { `storage.put` each ref (`mediaKey(gen.id, "reference-0"|"reference-1", ext)`) → `prisma.generation.update referenceImageUrls` → `provider.createJob({ imageUrls, prompt, aspectRatio })` → `prisma.generation.update providerJobId` } `catch` { `prisma.generation.update status:"failed"` }, unit resolves `gen.id`. Collect resolved ids in photo order. All units rejected → `PROVIDER_ERROR`; else `{ ok: true, ids }`. `provider.uploadImages` throwing (before any row) → `PROVIDER_ERROR`.

- [ ] **Step 5: Run → PASS.** `pnpm --filter product-photos test -- createBatch`

- [ ] **Step 6: Rewrite `src/app/api/generations/route.ts`** per spec §8 — `requireUser`→401; `form.getAll("referenceImages")` filtered to `File`, count 1–`MAX_REFERENCE_IMAGES` (422 `reference_images`), each `assertValidImage` (422 `invalid_image`); `JSON.parse` `photos` (catch→422), `batchInputSchema.safeParse` (422 `validation`); build `referenceImages` buffers; `createBatch(...)`; map result → 201/403/409/502.

- [ ] **Step 7: Write `src/app/api/generations/route.test.ts`**

Mock `@/lib/auth/session` (`requireUser`) + `@/lib/generations/create` (`createBatch`). Cases: no `referenceImages` → 422; `photos` not JSON → 422; `photos` length `MAX_PHOTOS+1` → 422; happy → 201 `{ids}` and `createBatch` called with the parsed photos + buffers; `createBatch` → `{ok:false,code:"NO_CREDITS",needed:3,available:2}` → 403 with `needed`/`available` in the body. Build the multipart request with `FormData` + `File` (Node 22 undici).

- [ ] **Step 8: Remove `generationInputSchema`**

Delete `generationInputSchema` + `GenerationInput` from `schemas.ts` and their cases from `schemas.test.ts` (grep first: the only importers were `create.ts` (now `createBatch`, uses `batchInputSchema` types) and the old `route.ts` (rewritten) — confirm nothing else imports it).

- [ ] **Step 9: Full verify**

Run: `pnpm --filter product-photos test && pnpm --filter product-photos typecheck && pnpm --filter product-photos lint && pnpm --filter product-photos build` — all clean. `poll.ts` / `poll.test.ts` untouched and green. `docker compose run --rm product-photos pnpm exec prisma migrate deploy` applies cleanly against a fresh DB (or note it will on next `docker compose up`).

- [ ] **Step 10: Commit**

```bash
git add apps/product-photos/prisma apps/product-photos/src/lib/generations apps/product-photos/src/app/api/generations apps/product-photos/src/lib/validation
git commit -m "Add batch generation: schema migration, createBatch, batch API route"
```

---

## Task 6: `/app` tool UI for batch generation

**Files:**
- Rename+rewrite: `src/hooks/useGeneration.ts` → `src/hooks/useBatchGeneration.ts`; `useGeneration.test.ts` → `useBatchGeneration.test.ts`
- Modify: `src/components/tool/Uploader.tsx`, `src/components/tool/OptionPicker.tsx`, `src/components/tool/GeneratePanel.tsx`, `src/components/tool/ProductPhotoTool.tsx`
- Create: `src/components/tool/PhotoCountSelector.tsx`, `src/components/tool/PhotoOptionsList.tsx`, `src/components/tool/ResultsGrid.tsx`
- Delete: `src/components/tool/ResultCard.tsx`

This is one task: the components are tightly coupled and only compile together. Build all of it, then verify the build + the hook test + a manual smoke.

**Interfaces:**

- `useBatchGeneration(opts?: { pollIntervalMs?: number; maxPollAttempts?: number })` → per spec §9:
  ```ts
  type PhotoStatus =
    | { id: string; status: "pending" }
    | { id: string; status: "completed"; generatedImageUrl: string }
    | { id: string; status: "failed"; error: string };
  {
    state: "idle" | "starting" | "generating" | "done" | "failed" | "out_of_credits";
    photos: PhotoStatus[];
    creditsRemaining: number | null;
    error: string | null;
    needed: number | null;
    available: number | null;
    start(args: { referenceImages: File[]; photos: { format: string; style: string; background: string }[]; instructions: string }): Promise<void>;
    reset(): void;
  }
  ```
- `Uploader` — props `{ value: File[]; onChange: (files: File[]) => void }`. Max `MAX_REFERENCE_IMAGES`. Renders a thumbnail + individual remove (×) per selected file; the drop/browse zone stays visible while `value.length < MAX_REFERENCE_IMAGES`, hidden when full. Client `assertValidImage` per newly added file → bad file: `copy.errors.invalidImage`; exceeding max: `copy.errors.tooManyImages(MAX_REFERENCE_IMAGES)`. `URL.createObjectURL` per preview, revoked on removal/unmount.
- `PhotoCountSelector` — `"use client"`. Props `{ value: number; onChange: (n: number) => void }`. A `SegmentedControl` over `Array.from({length: MAX_PHOTOS}, (_, i) => i + 1)`, labels `copy.tool.photoCountOption(n)`, group label `copy.tool.photoCountLabel`.
- `OptionPicker` — `OptionValue` becomes `{ format: FormatId | null; style: StyleId | null; background: BackgroundId | null }` (no `instructions`). Props gain `title?: string` (rendered as a small heading above the controls). The instructions `<textarea>` and its copy are removed from this component.
- `PhotoOptionsList` — `"use client"`. Props `{ count: number; value: OptionValue[]; onChange: (next: OptionValue[]) => void }`. Renders `count` `OptionPicker`s titled `copy.tool.photoNLabel(i+1)`. When `count` grows, append `{format:null,style:null,background:null}` entries; when it shrinks, truncate. (The parent owns `value`; this component just maps + patches by index.)
- `GeneratePanel` — props `{ count: number; needed: number; available: number; disabled: boolean; pending: boolean; onGenerate: () => void }`. Shows `copy.tool.creditsNeeded(needed, available)` — red (`text-accent-light`) when `available < needed`. Button label `copy.tool.generateN(count)`; disabled when `disabled || pending || available < needed`. While `pending`: a `<Spinner label={copy.tool.creatingBatch(done, total)} />` — but `done`/`total` come from the parent (pass a `progressLabel?: string` instead, computed in `ProductPhotoTool` from the hook's `photos`). Simplest: `GeneratePanel` takes `pending: boolean` + `progressLabel: string` and renders the spinner with that label.
- `ResultsGrid` — `"use client"`. Props `{ photos: PhotoStatus[]; creditsRemaining: number; onCreateAnother: () => void }`. Header `copy.tool.batchSummary(completedCount, creditsRemaining)`. A `grid gap-4 sm:grid-cols-2`; each tile: `completed` → the generated `<img>` + a Download `<a href={\`${generatedImageUrl}?download=1\`} download className={outline-button-classes}>{copy.tool.download}</a>`; `pending` → `<Spinner label={copy.tool.generating} />` in a bordered box; `failed` → `copy.errors.generationFailed` in a bordered box. Footer button `copy.tool.createAnother` → `onCreateAnother`.
- `ProductPhotoTool` — `"use client"`. Props unchanged (`{ initialCredits: number; user: { name: string | null; email: string } }`). State: `files: File[]`, `count: number` (default 1), `options: OptionValue[]` (default `[{null,null,null}]`), `instructions: string`, `useBatchGeneration()`. `ready = files.length >= 1 && options.slice(0, count).every(o => o.format && o.style && o.background)`. `pending = state === "starting" || state === "generating"`. `generate()`: guard, `await start({ referenceImages: files, photos: options.slice(0, count).map(o => ({ format: o.format!, style: o.style!, background: o.background! })), instructions })`. `useEffect` on `state === "done"` → `router.refresh()`. Branches: `initialCredits <= 0 && state !== "done"` OR `state === "out_of_credits"` → `<OutOfCreditsCard name={user.name} email={user.email} />`; `state === "done"` → `<ResultsGrid photos={photos} creditsRemaining={creditsRemaining ?? initialCredits} onCreateAnother={() => { reset(); setFiles([]); setCount(1); setOptions([{format:null,style:null,background:null}]); setInstructions(""); }} />`; else the builder tree: title/subtitle → `<Uploader value={files} onChange={setFiles} />` → (files.length ≥ 1) `<PhotoCountSelector value={count} onChange={n => { setCount(n); setOptions(prev => resize(prev, n)); }} />` → `<PhotoOptionsList count={count} value={options} onChange={setOptions} />` → shared instructions `<textarea>` (label `copy.tool.instructionsLabel`, placeholder `copy.tool.instructionsPlaceholder`, `maxLength={1000}`) → `<GeneratePanel count={count} needed={count} available={initialCredits} disabled={!ready} pending={pending} progressLabel={copy.tool.creatingBatch(completed, count)} onGenerate={generate} />` → (`state === "failed" && error`) an error `<p>`.

- [ ] **Step 1: Rename + rewrite the hook**

`git mv` both hook files. Rewrite `useBatchGeneration.ts` per the interface + spec §9. One `setInterval`; each tick `Promise.all` a `GET /api/generations/:id` for every still-`pending` photo; update entries; set `creditsRemaining` from any `completed` response; when none pending → `stop()` + `state:"done"`. Attempt cap → flip remaining `pending` to `failed` + `state:"done"`. `active` ref set `true` on effect setup (the F-wave fix). `start` handles 403 (→ `out_of_credits` + `needed`/`available`), 409 (→ `error`, `state:"failed"`), other non-ok (→ generic), 201 (→ seed `photos` from `ids`, `state:"generating"`, poll).

- [ ] **Step 2: Rewrite `useBatchGeneration.test.ts`**

`// @vitest-environment jsdom`, real timers, `renderHook(() => useBatchGeneration({ pollIntervalMs: 20 }))`. Cases:
- `403 {code:"NO_CREDITS",needed:3,available:1}` → `state==="out_of_credits"`, `needed===3`, `available===1`.
- 2 ids: mock `POST` → `{ids:["g1","g2"]}`; then per-id `GET` — tick 1 both `{status:"pending"}`, tick 2 `g1 {status:"completed",generatedImageUrl:"/m/g1",creditsRemaining:2}` + `g2 pending`, tick 3 `g2 completed` → `waitFor(state==="done")`; assert `photos` = 2 completed, `creditsRemaining===2`.
- attempt cap: `useBatchGeneration({ pollIntervalMs: 10, maxPollAttempts: 2 })`, `GET` always `pending` → `waitFor(state==="done")`, both photos `failed`.

- [ ] **Step 3: Build the components**

`Uploader` (File[]), `PhotoCountSelector`, `OptionPicker` (drop textarea + `title`), `PhotoOptionsList`, `GeneratePanel` (count/needed/available/progressLabel), `ResultsGrid`, then rewire `ProductPhotoTool`, then `git rm src/components/tool/ResultCard.tsx`. Every string via `copy`. Reuse `@/components/ui/*` primitives. Add a small `resize(arr, n)` helper inline in `ProductPhotoTool` (pad with `{format:null,style:null,background:null}` / truncate).

- [ ] **Step 4: Verify**

Run: `pnpm --filter product-photos test` (the hook test + all prior) → green; `pnpm --filter product-photos typecheck && lint && build` → clean (`ƒ /app` route present). Then `pnpm --filter product-photos dev` → open `/app`, sign in, and manually confirm: upload 2 references (each with remove ×), pick count 3, three "Foto N" option cards appear, shared instructions textarea below, "Generar 3 fotos" enabled only when all 9 selects + ≥1 image are set, the credits line reads "Necesitás 3 créditos · tenés X". (A real generation needs `KIE_API_KEY` — if unset, confirm the request fires and the UI shows the loading grid; a 502/failed grid is acceptable evidence without a key.)

- [ ] **Step 5: Commit**

```bash
git add apps/product-photos/src/hooks apps/product-photos/src/components/tool
git commit -m "Rebuild the /app tool UI for batch generation"
```

---

## Task 7: Full verification pass

**Files:** none (verification only; fix-forward with small commits if anything fails).

- [ ] **Step 1: Monorepo checks** — `pnpm -r typecheck && pnpm -r lint && pnpm -r test && pnpm -r build` — all green for both apps. Record the product-photos test count (should be ~70+).

- [ ] **Step 2: Clean Docker run** — `docker compose down -v && docker compose up --build` → postgres healthy → `prisma migrate deploy` applies BOTH `0_init` and `batch_generation` → app serves `:3000`.

- [ ] **Step 3: Security spot-checks** — `rg -n "KIE_API_KEY|FORMSUBMIT_EMAIL" apps/product-photos/.next/static` returns nothing; media route still 404s a foreign generation id; `POST /api/generations` with no session → 401.

- [ ] **Step 4: End-to-end manual flow** (with a real `KIE_API_KEY`): upload 2 references → count 4, each photo a different format/style/background + one shared instruction → "Generar 4 fotos" → 4 tiles fill in progressively (parallel) → 4 credits consumed → downloads work → header "4 fotos · 4 créditos usados · te quedan X". Then with 2 credits: pick 3 → credits line red, button disabled; pick 2 → enabled. Exhaust credits → out-of-credits card + feedback form. `curl POST /api/generations` with a valid session but `photos` of length 5 → 422.

- [ ] **Step 5: Homepage regression** — `pnpm --filter web build` clean; `/product-photos` CTA still opens the tool.

- [ ] **Step 6: Commit** (only if fixes were needed)

```bash
git add -A
git commit -m "Fix issues found in the batch-generation verification pass"
```

---

## Self-Review

**1. Spec coverage**

| Spec section | Task |
|---|---|
| §2 constants (`MAX_PHOTOS`, `MAX_REFERENCE_IMAGES`) | 1 |
| §3 data model (`referenceImageUrls String[]`, drop `originalImageUrl`, no `batchId`) | 5 |
| §4 storage keys + media route kinds | 2 |
| §5 validation (`photoOptionSchema`, `batchInputSchema`, remove `generationInputSchema`) | 3, 5 |
| §6 provider split (`uploadImages` + `createJob({imageUrls})`) + plural prompt | 1, 4 |
| §7 `createBatch` flow (reap → guard → credit gate → upload once → `Promise.allSettled` → ids in order → partial failure) | 5 |
| §8 batch API route (multipart, status mapping) | 5 |
| §9 `useBatchGeneration` + all `components/tool` changes + `copy.ts` keys | 1 (copy), 6 |
| §10 tests | 1–6 (per task) |
| §11 verification | 7 |
| §12 not-built list | Global Constraints + no task builds any of it |

No gaps.

**2. Placeholder scan** — no "TBD"/"handle edge cases"/"similar to Task N". Task 6 is described by interface + spec-section pointers rather than full code because it is ~9 tightly-coupled UI files; each component's props, state, and copy keys are fully specified above and in spec §9.

**3. Type consistency**

- `MediaKind` widening (Task 2) is used consistently by `createBatch` (`mediaKey(id,"reference-0",ext)`, Task 5) and the media route (`KINDS`, Task 2).
- `CreateJobInput.imageUrls: string[]` (Task 4) matches `createBatch`'s `provider.createJob({ imageUrls, prompt, aspectRatio })` call (Task 5) and the `kie-provider` test (Task 4).
- `batchInputSchema` `photos` entries `{format,style,background}` (Task 3) match `createBatch`'s `photos` param (Task 5) and the route's parse (Task 5) and `useBatchGeneration.start`'s `photos` arg (Task 6).
- `createBatch` return union (`{ok:true,ids}` / `NO_CREDITS`+`needed`+`available` / `GENERATION_IN_PROGRESS` / `PROVIDER_ERROR`, Task 5) matches the route's HTTP mapping (Task 5) and `useBatchGeneration`'s response handling (Task 6: 403→`out_of_credits`+`needed`/`available`, 409→error, 201→`ids`).
- `PhotoStatus` (Task 6 hook) matches `ResultsGrid`'s `photos` prop and the per-id `GET` response shape (`{status:"completed",generatedImageUrl,creditsRemaining}` — unchanged endpoint).
- `OptionValue` loses `instructions` (Task 6) — `PhotoOptionsList`, `ProductPhotoTool`, and `OptionPicker` all use the 3-field shape; `instructions` is a separate `string` state on `ProductPhotoTool` passed to `start`.
- `copy.tool.*` / `copy.errors.*` keys added in Task 1 are all referenced in Task 6 components (cross-checked against spec §9's copy list).
