# Product Photos — Batch Generation Design Spec

Date: 2026-09-07
Status: Approved by user, pending written-spec review
Builds on: `docs/superpowers/specs/2026-09-06-product-photos-mvp-design.md`

## 1. Purpose & scope

Extend the Product Photos MVP so a user can generate **1–4 output photos in
one request**, each with its own **format / style / background**, from a
shared set of **1–2 reference images** and one shared free-text
instructions field.

**In scope:** a photo-count selector (1–4), per-photo option cards, a
1–2 image reference uploader, a batch-aware `POST /api/generations`, a
batch credit gate (`credits >= N`), a results grid, the client batch
polling hook, one Prisma migration, and the `ProductPhotoProvider`
split of upload-vs-createJob.

**Explicitly out of scope:** a `Batch` DB table / batch history, per-photo
instructions, per-photo reference images, partial-batch generation when
credits are short (the whole batch is blocked instead), re-running a
single failed photo from a completed batch (the user re-generates the
whole set), queueing, and any change to `GET /api/generations/:id`,
`poll.ts`, auth, Docker, the `User` model, or FormSubmit.

**Unchanged rules carried from the MVP spec:** a credit is consumed by
exactly one successful generation, in a transaction, never on failure;
secrets stay server-only; resource authorization returns 404; all UI
strings live in `apps/product-photos/src/content/copy.ts`; Spanish only.

## 2. Product constants

New module `apps/product-photos/src/lib/limits.ts`:

```ts
export const MAX_PHOTOS = 4;              // output photos per request
export const MAX_REFERENCE_IMAGES = 2;    // uploaded reference images per request
```

These are product values, not env vars. `MAX_UPLOAD_MB` (per-file size)
and `ALLOWED_IMAGE_TYPES` are unchanged and still apply to each reference
image.

## 3. Data model

One Prisma migration (`prisma migrate diff` against the current schema —
Docker is available now, so `prisma migrate dev --name batch_generation`
is fine; either produces the same SQL).

### `Generation` — changed field

- **Remove** `originalImageUrl String`.
- **Add** `referenceImageUrls String[]` — the 1–2 reference-image URLs
  (`/api/media/<genId>/reference-0`, optionally `.../reference-1`), stored
  on **every** row of the batch (the 1–2 images are re-persisted per row;
  they are small and this keeps the media route and the ownership model
  keyed purely on `generationId`).

Everything else on `Generation` is unchanged and stays **per row**:
`format`, `style`, `background`, `instructions` (same value across a
batch, but written to each row), `prompt` (built per row from that row's
options), `providerJobId`, `status`, `error`, `generatedImageUrl`,
`createdAt`, the three indexes.

**No `batchId` column.** A batch is N independent `Generation` rows
created in one request; the client holds the id list for the session.
This keeps the concurrency guard, the media route, `poll.ts`, and the
per-id status endpoint all unchanged.

### Migration notes

- `referenceImageUrls String[]` maps to a Postgres `text[]` with default
  `[]` (`@default([])`), so `prisma migrate deploy` needs no data
  backfill (there is no production data; local dev volumes can be reset).
- Dropping `originalImageUrl` is a destructive column drop — acceptable,
  no real data exists.

## 4. Storage & media route

### Storage keys (`src/lib/storage/index.ts`)

`mediaKey(generationId, kind, ext)` where `kind` is now one of:
`"generated"`, `"reference-0"`, `"reference-1"`.

- `readMedia(generationId, kind)` — extend the `EXT_BY_KIND` map:
  `generated → ["png"]`, `reference-0 → ["jpg","jpeg","png","webp"]`,
  `reference-1 → ["jpg","jpeg","png","webp"]`.

### Media route (`src/app/api/media/[id]/[kind]/route.ts`)

- `KINDS` set becomes `{ "generated", "reference-0", "reference-1" }`.
- Everything else (auth, ownership → 404, `?download=1`, headers) is
  unchanged.

## 5. Validation (`src/lib/validation/schemas.ts` + `upload.ts`)

- **New** `photoOptionSchema` — `{ format, style, background }` validated
  against the catalog guards (`isFormatId` / `isStyleId` /
  `isBackgroundId`), same as today's `generationInputSchema` minus
  `instructions`.
- **New** `batchInputSchema`:
  ```ts
  z.object({
    photos: z.array(photoOptionSchema).min(1).max(MAX_PHOTOS),
    instructions: z.string().trim().max(1000).optional(),
  })
  ```
- `generationInputSchema` (the current single-photo schema) is **removed**
  — the route no longer has a single-photo path (count = 1 is a batch of
  one).
- `assertValidImage` / `contentTypeToExt` / `ALLOWED_IMAGE_TYPES` /
  `MAX_UPLOAD_BYTES` — unchanged, applied to each reference image.

## 6. AI provider (`src/lib/ai/*`)

### `ProductPhotoProvider` interface — split upload from job creation

```ts
export interface UploadImageInput {
  data: Buffer;
  contentType: string;
  fileName: string;
}

export interface CreateJobInput {
  imageUrls: string[];           // 1–2 provider-hosted reference URLs
  prompt: string;
  aspectRatio: "1:1" | "4:5" | "9:16" | "16:9";
}

export interface ProductPhotoProvider {
  uploadImages(images: UploadImageInput[]): Promise<string[]>;   // NEW
  createJob(input: CreateJobInput): Promise<{ jobId: string }>;  // CHANGED: imageUrls, not a Buffer
  getJob(jobId: string): Promise<JobResult>;                      // unchanged
}
```

### `KieProvider`

- `uploadImages(images)` — POST each to `KIE_UPLOAD_URL` (multipart), in
  parallel (`Promise.all`), return the `downloadUrl ?? fileUrl` list in
  input order. Throws on any upload failure (as today's `uploadImage`
  does).
- `createJob({ imageUrls, prompt, aspectRatio })` — no upload step now;
  `POST /api/v1/jobs/createTask` with `input.image_input = imageUrls`
  (1 or 2 entries), everything else unchanged (`model`, `resolution`,
  `output_format: "png"`, the body-`code` error check from the last fix
  wave, the `unknown state → failed` mapping).
- `getJob` — unchanged.

### `buildPrompt` (`src/lib/ai/prompt.ts`)

- The base block's opening line changes to reference "the provided
  product image(s)" (plural-safe wording). No new parameter — the number
  of images doesn't change the prompt structure.

## 7. Generation creation (`src/lib/generations/`)

`create.ts` is rewritten as **`createBatch`** (the old `createGeneration`
name and single-photo shape go away):

```ts
export async function createBatch(args: {
  userId: string;
  referenceImages: { data: Buffer; contentType: string }[];   // length 1–2
  photos: { format: FormatId; style: StyleId; background: BackgroundId }[]; // length 1–MAX_PHOTOS
  instructions?: string;
}): Promise<
  | { ok: true; ids: string[] }
  | { ok: false; code: "NO_CREDITS"; needed: number; available: number }
  | { ok: false; code: "GENERATION_IN_PROGRESS" }
  | { ok: false; code: "PROVIDER_ERROR" }
>;
```

Flow:

1. **Reap stale pendings** for this user (the existing F1 reap —
   `updateMany status:"pending" AND createdAt <= now-STALE_MS → "failed"`).
2. **In-progress guard** — `findFirst({ where: { userId, status:
   "pending" } })` (no `createdAt` filter, per the F1 fix). Any live
   pending → `{ ok: false, code: "GENERATION_IN_PROGRESS" }`.
3. **Credit gate** — `const available = await getCredits(userId)`. If
   `available < photos.length` →
   `{ ok: false, code: "NO_CREDITS", needed: photos.length, available }`.
4. **Upload references once** — `const imageUrls = await
   provider.uploadImages(referenceImages.map(…))`. On throw → mark
   nothing (no rows yet), return `{ ok: false, code: "PROVIDER_ERROR" }`.
5. **Per photo — kicked off in parallel** (`Promise.allSettled` over the N
   photos; 4 concurrent Kie `createTask` POSTs is trivial load and shaves
   the pre-201 wait to ~1s). For each photo, a `startPhoto(photo, index)`
   async unit does:
   - `const aspectRatio = formatToAspectRatio(photo.format)`
   - `prompt = buildPrompt({ style: photo.style, background:
     photo.background, instructions })`
   - `const gen = await prisma.generation.create({ data: { userId,
     referenceImageUrls: [], format: photo.format, style: photo.style,
     background: photo.background, instructions: instructions ?? null,
     prompt, status: "pending" } })`
   - `try { ` — store each reference image
     (`storage.put(mediaKey(gen.id, "reference-0", ext0), buf0, ct0)`, and
     `reference-1` if present), then `prisma.generation.update({ where:
     { id: gen.id }, data: { referenceImageUrls: [mediaApiUrl(gen.id,
     "reference-0"), …(mediaApiUrl(gen.id, "reference-1") if 2)] } })`,
     then `const { jobId } = await provider.createJob({ imageUrls,
     prompt, aspectRatio })` and `prisma.generation.update({ where: { id:
     gen.id }, data: { providerJobId: jobId } })`
   - ` } catch (e) { await prisma.generation.update({ where: { id:
     gen.id }, data: { status: "failed", error: <msg> } }); }` — a
     per-photo storage/provider failure fails **only that row**
   - the unit resolves with `gen.id` (whether the row ended `pending` or
     `failed`)
   Run all N units via `Promise.allSettled`; `ids` is the resolved
   `gen.id` list **in photo order** (each unit created its row before it
   could throw, so every unit resolves with an id — a rejection here means
   `prisma.generation.create` itself threw, which is an infra failure:
   see step 6).
6. If **every** unit rejected (all `generation.create` calls threw —
   DB down): return `{ ok: false, code: "PROVIDER_ERROR" }` (no rows to
   report). Otherwise return `{ ok: true, ids }` with the ids of the
   units that resolved. (Rows that ended `failed` at
   step 5 — the client polls all ids and renders per-photo status.)

**Partial-failure semantics:** the credit gate guarantees `credits >=
N` at start, but each photo still only consumes its credit on its own
successful completion (in `poll.ts`, unchanged). If K of N fail, the
user is charged for N−K and gets N−K images plus K "failed" tiles.

The wider try/catch around `storage.put` + the reference `update`
(the F1-derived hardening) stays: any infra throw inside a per-photo unit
marks that row `failed` and the other units are unaffected (`allSettled`).

### `poll.ts` — unchanged

Each `Generation` is still polled independently by id. The atomic
`updateMany({ where: { id, status: "pending" } })` claim + `count === 1`
credit consume is unchanged and already batch-safe (each row is claimed
once).

## 8. API route (`src/app/api/generations/route.ts`)

`POST` — `multipart/form-data`:

| field | value |
|---|---|
| `referenceImages` | 1–2 `File` entries (repeated field name) |
| `photos` | a JSON string — array of `{ format, style, background }`, length 1–`MAX_PHOTOS` |
| `instructions` | optional string, shared |

Handler:

1. `requireUser()` → 401.
2. `const files = form.getAll("referenceImages").filter(f => f instanceof File)`.
   `files.length < 1 || files.length > MAX_REFERENCE_IMAGES` →
   `422 { error: "reference_images", reason: "count" }`.
   Each file through `assertValidImage` → `422 { error: "invalid_image",
   reason }`.
3. `JSON.parse` the `photos` field (catch → 422), then
   `batchInputSchema.safeParse({ photos, instructions })` →
   `422 { error: "validation", issues }`.
4. `const referenceImages = await Promise.all(files.map(async f => ({
   data: Buffer.from(await f.arrayBuffer()), contentType: f.type })))`.
5. `const result = await createBatch({ userId, referenceImages, photos,
   instructions })`.
6. Map result → `201 { ids }` · `403 { code: "NO_CREDITS", needed,
   available }` · `409 { code: "GENERATION_IN_PROGRESS" }` ·
   `502 { code: "PROVIDER_ERROR" }`.

`GET /api/generations/[id]/route.ts` — **unchanged**.

## 9. Client

### `src/hooks/useBatchGeneration.ts` (replaces `useGeneration.ts`)

```ts
type PhotoStatus =
  | { id: string; status: "pending" }
  | { id: string; status: "completed"; generatedImageUrl: string }
  | { id: string; status: "failed"; error: string };

useBatchGeneration(opts?: { pollIntervalMs?: number; maxPollAttempts?: number }) → {
  state: "idle" | "starting" | "generating" | "done" | "failed" | "out_of_credits";
  photos: PhotoStatus[];                 // one per requested output photo, in order
  creditsRemaining: number | null;       // from the most recent completed poll
  error: string | null;                  // batch-level error (409, 5xx, network)
  needed: number | null;                 // set on out_of_credits
  available: number | null;              // set on out_of_credits
  start(args: {
    referenceImages: File[];             // 1–2
    photos: { format: string; style: string; background: string }[];
    instructions: string;
  }): Promise<void>;
  reset(): void;
}
```

- `start` builds `FormData` (`referenceImages` appended once per file,
  `photos` as `JSON.stringify(...)`, `instructions` if non-empty), `POST
  /api/generations`.
  - `403` → parse `{ needed, available }`, `state = "out_of_credits"`.
  - `409` → `error = copy.errors.inProgress`, `state = "failed"`.
  - other non-ok → `copy.errors.generic`, `state = "failed"`.
  - `201` → seed `photos` from `ids` as all `pending`, `state =
    "generating"`, start one polling loop.
- **One** `setInterval` polls every `pollIntervalMs` (default 2000). Each
  tick: `GET /api/generations/:id` for every still-`pending` photo (in
  parallel). Update that photo's entry on `completed` / `failed`; on
  `completed` also set `creditsRemaining` from the response. When no
  photo is `pending` → `stop()`, `state = "done"`.
- The F2c attempt cap applies to the **batch**: after `maxPollAttempts`
  (default 90) ticks with any photo still pending → `stop()`, mark the
  remaining `pending` photos `failed` with `copy.errors.generationFailed`,
  `state = "done"` (a mix of completed + failed is still "done").
- Polls stop on unmount and on `reset()` (the `active` ref pattern from
  the F-wave fix — set `true` on effect setup).

### `src/components/tool/` changes

| component | change |
|---|---|
| `Uploader.tsx` | `value: File[]`, `onChange: (files: File[]) => void`, `max = MAX_REFERENCE_IMAGES`. Shows each preview with an individual remove button; the drop zone stays visible until `max` reached. Client-side `assertValidImage` per file; `copy.errors.invalidImage` / a new `copy.errors.tooManyImages`. |
| `PhotoCountSelector.tsx` | **new** — a `SegmentedControl` over `[1,2,3,4]` (labels `copy.tool.photoCountOption(n)` → e.g. "1 foto" / "2 fotos"). Group label `copy.tool.photoCountLabel`. |
| `OptionPicker.tsx` | drop the instructions `<textarea>` (it moves to batch level). Add an optional `title` prop (e.g. "Foto 1"). `OptionValue` loses `instructions`. |
| `PhotoOptionsList.tsx` | **new** — renders `count` `OptionPicker`s titled `copy.tool.photoNLabel(i)`; holds `PhotoOptionValue[]`; growing/shrinking `count` adds/removes entries (new entries default all-null). |
| `GeneratePanel.tsx` | button label `copy.tool.generateN(count)` ("Generar 3 fotos"); the credits line `copy.tool.creditsNeeded(needed, available)` ("Necesitás 3 créditos · tenés 2"), rendered red + button disabled when `available < needed`. |
| `ResultsGrid.tsx` | **new** — replaces `ResultCard` for the batch. A responsive grid (1 col mobile, `sm:grid-cols-2`) of tiles; each tile shows the generated image + a Download `<a download>` (the F10 pattern) when `completed`, a small spinner + `copy.tool.generating` when `pending`, and `copy.errors.generationFailed` when `failed`. Header line `copy.tool.batchSummary(done, credits)` ("3 fotos · 3 créditos usados · te quedan 1"). Buttons: `copy.tool.createAnother` (reset). |
| `ResultCard.tsx` | removed (folded into `ResultsGrid`). |
| `FeedbackForm.tsx` / `OutOfCreditsCard.tsx` | unchanged, still shown when `state === "out_of_credits"` or `initialCredits <= 0`. |
| `ProductPhotoTool.tsx` | rewired: owns `files: File[]`, `count: number` (default 1), `options: PhotoOptionValue[]`, `instructions: string`, and `useBatchGeneration()`. `ready = files.length >= 1 && count photos each with all 3 options set`. `router.refresh()` in a `useEffect` on `state === "done"` (the F-wave placement). Out-of-credits branch: `initialCredits <= 0` OR `state === "out_of_credits"`. |

### `src/content/copy.ts` additions

`tool.photoCountLabel`, `tool.photoCountOption(n)`, `tool.photoNLabel(i)`,
`tool.generateN(n)`, `tool.creditsNeeded(needed, available)`,
`tool.batchSummary(done, remaining)`, `tool.addReference`,
`tool.referencesHint` (updated to "hasta 2"); `errors.tooManyImages`,
`errors.notEnoughCredits(needed, available)`. The `formats` / `styles` /
`backgrounds` label maps and existing keys are unchanged.

## 10. Testing

Vitest, following the existing `apps/product-photos` patterns
(`vi.hoisted`, `@/generated/prisma/client` import path, mocked
`@/lib/db/client` / provider / storage):

- **`limits.ts`** — trivially covered by the schema tests.
- **`validation/schemas.test.ts`** — `batchInputSchema`: rejects an empty
  `photos` array, rejects `> MAX_PHOTOS`, rejects an unknown style in any
  entry; accepts 1 and 4 valid entries; `instructions` optional.
- **`kie-provider.test.ts`** — `uploadImages([a, b])` posts twice and
  returns both URLs in order; `createJob({ imageUrls: [u1, u2], … })`
  sends `image_input: [u1, u2]` and `model: "nano-banana-2"`; a single
  URL still works. Keep the existing `getJob` mapping tests.
- **`generations/createBatch.test.ts`** (renamed from `create.test.ts`):
  - blocks with `GENERATION_IN_PROGRESS` when a pending row exists
  - the stale reap runs before the guard
  - `credits < photos.length` → `{ ok:false, code:"NO_CREDITS", needed,
    available }` and **no** `generation.create` call
  - happy path: `photos.length === 3`, `credits === 3` → `uploadImages`
    called **once**, `createJob` called 3× (order-independent —
    `Promise.allSettled`), 3 rows created, returns 3 ids **in photo
    order**
  - one `createJob` throws → that row updated to `failed`, the other rows
    still created + `pending`, still returns all 3 ids (`ok: true`)
  - all `prisma.generation.create` calls throw → `{ ok:false,
    code:"PROVIDER_ERROR" }`
- **`poll.test.ts`** — unchanged (still valid; each id polled独立ly).
- **`useBatchGeneration.test.ts`** (renamed from `useGeneration.test.ts`,
  `// @vitest-environment jsdom`, real timers, small `pollIntervalMs`):
  - `403` response → `state === "out_of_credits"`, `needed` / `available`
    populated
  - 2 ids: first poll both pending, second poll one completed + one
    pending, third poll both completed → `state === "done"`, `photos`
    has 2 completed entries, `creditsRemaining` set
  - the attempt-cap: with `maxPollAttempts: 2` and a never-completing
    mock → remaining photos flip to `failed`, `state === "done"`
- **API route** — a `route.test.ts` covering: missing `referenceImages`
  → 422; `photos` not valid JSON → 422; `> MAX_PHOTOS` → 422; happy path
  → 201 `{ ids }`; `createBatch` → `NO_CREDITS` → 403 with `needed` /
  `available` in the body.

Target: the current 65 tests stay green (minus the renamed files) and the
suite grows.

## 11. Verification

- `pnpm --filter product-photos test` green; `typecheck` / `lint` /
  `build` clean; `pnpm --filter web build` clean.
- `docker compose up --build` → the new migration applies via
  `prisma migrate deploy`.
- Manual: upload 2 references, pick 4 photos each with different
  format/style/background + a shared instruction, confirm 4 tiles render
  progressively, 4 credits are consumed, downloads work, the header
  shows "4 fotos · 4 créditos usados · te quedan X"; then with 2 credits
  left, pick 3 → the credits line goes red and Generate is disabled;
  drop to 2 → enabled again.
- `docker compose down -v` then `up` — F3 layout guard still redirects a
  stale session to sign-out (no regression from the model change).

## 12. Explicitly deferred

- A `Batch` table / batch history screen.
- Per-photo instructions or per-photo reference images.
- Partial-batch generation when credits are short.
- Re-generating one failed tile from an otherwise-complete batch.
- Deduplicating reference-image storage across a batch's rows.
- Reference-image count beyond 2 (Kie supports up to 14).

## 13. Spec self-review

- **Placeholders:** none.
- **Consistency:** `MAX_PHOTOS`/`MAX_REFERENCE_IMAGES` defined once (§2)
  and referenced in §5/§8/§9; the credit rule is stated once (§7) and
  cross-referenced; the provider interface (§6) matches its consumers
  (§7 `createBatch`, §10 tests); `kind` values (§4) match `readMedia`
  (§4) and the media route (§4).
- **Scope:** one migration + one app; no decomposition needed. The
  change is contained to `apps/product-photos` (`lib/ai`, `lib/generations`,
  `lib/validation`, `lib/storage`, `lib/limits`, the generations + media
  routes, `content/copy`, `prisma`, and the `components/tool` + `hooks`
  layer). `apps/web`, auth, Docker config, and the `User` model are
  untouched.
- **Ambiguity resolved:** every request is a batch (count 1 = batch of
  one — no separate single path); references are shared and 1–2; the
  batch is blocked (not partial) when `credits < N`; instructions are
  one shared value written to every row; no `batchId` column; the
  per-id status endpoint and `poll.ts` do not change; the N Kie tasks
  are kicked off **in parallel** (`Promise.allSettled`) and the
  generations themselves run concurrently on Kie — the results grid
  fills in as each finishes.
