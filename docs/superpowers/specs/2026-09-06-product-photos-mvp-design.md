# Novalup AI — Product Photos MVP Design Spec

Date: 2026-09-06
Status: Approved by user, pending written-spec review

## 1. Purpose & scope

Build a **deliberately small MVP** of an AI Product Photos tool for Novalup
AI. The goal is **not** a full SaaS: no payments, no plans. The goal is to
validate, fast, whether users sign up, upload a product, generate images,
enjoy the result, hit the free limit, and leave feedback.

The MVP must let us answer:

1. Do people sign up?
2. Do they upload a product?
3. Do they generate images?
4. Do they use their free credits?
5. Do they reach the limit?
6. Do they leave feedback?
7. Would they ask for more credits?

**In scope:** a focused product app with its own landing, email/password +
Google auth, a free-credit system, the upload → options → generate →
result flow backed by Kie.ai (Nano Banana 2), an out-of-credits feedback
form (FormSubmit), PostgreSQL persistence via Prisma, and a Docker Compose
setup that runs the whole thing locally.

**Explicitly out of scope** (see §12): payments, Stripe, Mercado Pago,
subscriptions, plans, credit packs, coupons, billing, admin, advanced
analytics, referrals, teams, collaboration, email marketing, a
notification system, CMS, blog, marketplace, multiple AI providers, a
complex storage system, an image editor, video generation, a public API,
a mobile app, sophisticated password recovery, email verification,
complex roles.

**Relationship to the existing site:** the repo currently holds the
Novalup AI marketing homepage (a single Next.js app at the root). Its
`/product-photos` route is a placeholder. This effort is the "real product
platform" that the homepage spec deferred. The homepage becomes
`apps/web`; this tool becomes `apps/product-photos`. The homepage's
`/product-photos` placeholder stays a placeholder — its CTA points at the
tool app's URL.

## 2. Monorepo restructuring

The repo is converted to a **pnpm workspaces** monorepo. No Turborepo yet
(YAGNI — two apps, plain workspace scripts are enough).

```
/
├── package.json              # root, private; scripts: dev:web, dev:photos, build:*, lint, typecheck
├── pnpm-workspace.yaml       # packages: apps/*, packages/*
├── pnpm-lock.yaml            # regenerated once during the move
├── tsconfig.base.json        # shared compiler options; apps extend it
├── docker-compose.yml        # product-photos + postgres
├── .env.example              # for compose / the app
├── .dockerignore
├── README.md                 # run instructions (see §11)
├── docs/superpowers/…
├── packages/
│   └── brand/                # the ONLY shared package
│       ├── package.json      # name: @novalup/brand
│       └── tailwind-preset.ts # night/accent color tokens, Inter font var, float keyframes
└── apps/
    ├── web/                  # existing homepage, moved verbatim
    │   └── … (src/, public/, next.config.ts, tailwind.config.ts → uses @novalup/brand preset)
    └── product-photos/       # the MVP (see §4–§10)
```

### The move (`apps/web`)

- All homepage files move under `apps/web/` unchanged: `src/`, `public/`,
  `next.config.ts`, `next-env.d.ts`, `postcss.config.mjs`,
  `eslint.config.mjs`, `tailwind.config.ts`, `tsconfig.json`.
- `apps/web/package.json` keeps the current dependencies and its
  `dev -p 3100` script.
- `apps/web/tailwind.config.ts` changes only to
  `presets: [require("@novalup/brand/tailwind-preset")]` and keeps its
  `content` glob; the inline token duplication is removed.
- `apps/web/tsconfig.json` adds `"extends": "../../tsconfig.base.json"`;
  keeps its `paths` (`@/*` → `./src/*`) and `next` plugin.
- Behavior of the homepage does not change. Verification: `pnpm --filter
  web build` + `typecheck` + `lint` clean, and a manual smoke check of the
  homepage in both locales.
- The homepage's `/product-photos` placeholder page and the "Try tool"
  CTAs that point at it are updated to link to
  `process.env.NEXT_PUBLIC_PRODUCT_PHOTOS_URL` (default
  `http://localhost:3000`).

### `packages/brand`

The single shared package. Exports a Tailwind **preset** carrying the
brand tokens both apps use (`night`, `accent` scales), the `--font-inter`
family, and the `float` / `float-sm` keyframes + animations. Rationale:
these evolve as the brand evolves and must stay in lockstep across apps;
duplicating them invites drift. Nothing else is shared yet — Prisma, UI
components, and config stay app-local until a second product genuinely
needs them.

`tsconfig.base.json` holds the compiler options that are identical across
apps (`strict`, `target`, `moduleResolution: bundler`, `jsx`, etc.). Each
app's `tsconfig.json` extends it and adds only `paths`, `plugins`,
`include`/`exclude`.

## 3. Stack — `apps/product-photos`

| Area | Choice | Notes |
|---|---|---|
| Framework | Next.js 16 (App Router) + TypeScript + Tailwind v3 | matches `apps/web` |
| UI language | **Spanish only**, no `next-intl` | all user-facing strings centralized in `src/content/copy.ts` as the future i18n seam |
| Auth | `next-auth@5` (Auth.js) + `@auth/prisma-adapter` | providers: Google + Credentials; **JWT session strategy** (required with Credentials) |
| Password hashing | `bcryptjs` | pure JS, no native build → simple Docker image |
| DB | PostgreSQL + Prisma | `prisma/` lives inside the app; extracted to a package only when a 2nd product needs it |
| AI | Kie.ai, model `nano-banana-2` | polling (no webhook — runs locally in Docker with no public URL) |
| Storage | local Docker volume behind a `Storage` interface | swap to S3/R2 later without touching callers |
| Feedback | FormSubmit, via a **server-side proxy** | keeps `FORMSUBMIT_EMAIL` off the client |
| Validation | `zod` | every API route validates its input |
| Tests | Vitest for pure logic | prompt builder, credits service, validation schemas, option catalogs; UI flow = manual QA |
| Port | `3000` in dev and in Docker | |

Package scripts: `dev`, `build`, `start`, `lint`, `typecheck`,
`test`, `prisma:migrate`, `prisma:studio`.

## 4. Data model (Prisma)

Datasource: PostgreSQL. Generator: `prisma-client-js`.

Auth.js standard models — `User`, `Account`, `Session`,
`VerificationToken` — are included as the adapter expects them. `Session`
is unused at runtime (JWT strategy) but kept for adapter type
compatibility and future flexibility.

```prisma
model User {
  id            String       @id @default(cuid())
  name          String?
  email         String       @unique
  emailVerified DateTime?
  image         String?
  passwordHash  String?      // set only for email/password signups
  credits       Int          @default(0)   // seeded from FREE_CREDITS at creation (see §6)
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
  accounts      Account[]
  sessions      Session[]
  generations   Generation[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

model Generation {
  id                String           @id @default(cuid())
  userId            String
  user              User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  originalImageUrl  String           // e.g. /api/media/<id>/original
  generatedImageUrl String?          // e.g. /api/media/<id>/generated
  format            String           // "1:1" | "4:5" | "9:16" | "16:9"
  style             String           // studio | lifestyle | luxury | minimal | social-media
  background        String           // clean | premium | natural | custom
  instructions      String?          // optional free text
  prompt            String           // final prompt sent to Nano Banana 2
  providerJobId     String?          // Kie taskId
  status            GenerationStatus @default(pending)
  error             String?          // provider failure message, when status = failed
  createdAt         DateTime         @default(now())

  @@index([userId])
  @@index([createdAt])
  @@index([userId, status])
}

enum GenerationStatus {
  pending
  completed
  failed
}
```

Fields added beyond the original spec's `Generation`: `background`,
`instructions`, `providerJobId`, `error`. They are required for the real
flow. `status` values are exactly `pending | completed | failed`.

Indexes: `Generation.userId`, `Generation.createdAt`, plus a composite
`(userId, status)` used by the "reject if a pending generation already
exists" guard (§7).

## 5. Library architecture (`src/lib`)

Separation follows §18 of the brief — auth, database, AI provider, image
handling, credits, feedback are distinct units — without proliferating
files.

```
src/lib/
  auth/
    auth.ts              # Auth.js config: providers, adapter, JWT callbacks, events.createUser
    password.ts          # hash() / verify() via bcryptjs
    session.ts           # getSession() / requireUser() helpers for route handlers
  db/
    client.ts            # PrismaClient singleton (global in dev)
  credits/
    config.ts            # FREE_CREDITS = Number(process.env.FREE_CREDITS ?? 3)
    service.ts           # getCredits(userId), grantFreeCredits(userId), consumeOneCredit(tx, userId)
  storage/
    index.ts             # interface Storage { put(key, data, contentType): Promise<{ url }>; read(key): Promise<Buffer>; }
    local.ts             # LocalStorage — writes under STORAGE_DIR (Docker volume), key = "<generationId>/<name>"
  ai/
    product-photo-provider.ts   # interface ProductPhotoProvider { createJob(input): Promise<{ jobId }>; getJob(jobId): Promise<JobResult> }
    kie-provider.ts             # Kie.ai implementation (upload + createTask + recordInfo)
    prompt.ts                   # buildPrompt({ style, background, instructions }): string
    options.ts                  # FORMATS, STYLES, BACKGROUNDS catalogs + format → aspect_ratio map
  feedback/
    formsubmit.ts        # submitFeedback(payload) — server-side POST to formsubmit.co
  validation/
    schemas.ts           # zod schemas: signup, generationInput, feedback
    upload.ts            # allowed mime types, MAX_UPLOAD_MB
```

**Rule:** no React component imports `kie-provider`, `KIE_API_KEY`, or
`FORMSUBMIT_EMAIL`. All provider and secret access is server-only, behind
API routes.

### AI provider interface

```ts
interface ProductPhotoProvider {
  createJob(input: {
    image: Buffer;
    contentType: string;
    prompt: string;
    aspectRatio: "1:1" | "4:5" | "9:16" | "16:9";
  }): Promise<{ jobId: string }>;

  getJob(jobId: string): Promise<
    | { status: "pending" }
    | { status: "completed"; imageUrl: string }
    | { status: "failed"; error: string }
  >;
}
```

`kie-provider.ts` implements it against:

- Upload: `POST https://kieai.redpandaai.co/api/file-stream-upload`
  (multipart: `file`, `uploadPath`, `fileName`) → hosted image URL.
- Create: `POST https://api.kie.ai/api/v1/jobs/createTask` with
  `{ model: "nano-banana-2", input: { prompt, image_input: [url],
  aspect_ratio, resolution, output_format: "png" } }` → `data.taskId`.
- Poll: `GET https://api.kie.ai/api/v1/jobs/recordInfo?taskId=…` →
  `data.state` ∈ `waiting | queuing | generating | success | fail`; on
  `success`, parse `data.resultJson` → `resultUrls[0]`.

Env: `KIE_API_KEY` (required), `KIE_BASE_URL` (default
`https://api.kie.ai`), `KIE_UPLOAD_URL` (default
`https://kieai.redpandaai.co/api/file-stream-upload`), `KIE_MODEL`
(default `nano-banana-2`), `KIE_RESOLUTION` (default `2K`).

### Prompt builder (`prompt.ts`)

Plain string template, easy to edit. Structure:

1. **Base preservation block** (always): preserve the exact product
   identity, shape, proportions, colors, branding, labels and packaging;
   do not invent or modify important product details; make the product
   the visual focus; create a professional commercial product photograph;
   realistic lighting and shadows; natural materials; photorealistic,
   high-end commercial result.
2. **Style block** — one paragraph selected by `style`:
   - `studio` → professional studio product photography, seamless
     backdrop, controlled lighting.
   - `lifestyle` → product integrated into a realistic in-use scene,
     natural environment.
   - `luxury` → premium editorial aesthetic, refined styling, dramatic
     light.
   - `minimal` → clean modern composition, lots of negative space, single
     light direction.
   - `social-media` → punchy, high-contrast, thumb-stopping framing for
     feeds.
3. **Background block** — selected by `background` (`clean` / `premium` /
   `natural` / `custom`). `custom` leans on the additional instructions.
4. **Additional instructions** — appended verbatim if present.

The final assembled string is persisted in `Generation.prompt`.

### Option catalogs (`options.ts`)

Single source of truth for the three choice groups. API routes validate
incoming `format`/`style`/`background` against these — never trust the
client.

```ts
export const FORMATS = [
  { id: "1:1",  label: "Cuadrado 1:1",   aspectRatio: "1:1"  },
  { id: "4:5",  label: "Retrato 4:5",    aspectRatio: "4:5"  },
  { id: "9:16", label: "Vertical 9:16",  aspectRatio: "9:16" },
  { id: "16:9", label: "Horizontal 16:9",aspectRatio: "16:9" },
] as const;

export const STYLES = ["studio", "lifestyle", "luxury", "minimal", "social-media"] as const;
export const BACKGROUNDS = ["clean", "premium", "natural", "custom"] as const;
```

## 6. Credits

- `FREE_CREDITS` is read once, in `lib/credits/config.ts`, from
  `process.env.FREE_CREDITS` (default `3`). It is referenced in exactly
  two creation paths:
  - **Email signup** — the `/api/auth` signup handler creates the `User`
    with `credits: FREE_CREDITS`.
  - **Google** — Auth.js `events.createUser` calls
    `grantFreeCredits(user.id)` (sets `credits = FREE_CREDITS`). This
    event fires only on adapter user creation, so it is not double-applied.
- The Prisma column default is `0`; the free grant is always explicit.
- **Reading credits:** always from the DB (`getCredits(userId)`), never
  from the JWT. The header count and every gate query the DB.
- **Consuming a credit** happens only on a successful generation, inside
  the `pending → completed` transition, in a transaction:

  ```ts
  await prisma.$transaction(async (tx) => {
    const gen = await tx.generation.findUnique({ where: { id } });
    if (!gen || gen.status !== "pending") return "already-processed";
    await tx.generation.update({
      where: { id },
      data: { status: "completed", generatedImageUrl },
    });
    const res = await tx.user.updateMany({
      where: { id: gen.userId, credits: { gt: 0 } },
      data: { credits: { decrement: 1 } },
    });
    // res.count === 1 expected; 0 only in a rare race (still delivered)
  });
  ```

- A **failed** generation never decrements.
- UI copy: show "N free credits" while `credits === FREE_CREDITS` (user
  has not generated yet), otherwise "N credits remaining" (Spanish
  equivalents in `copy.ts`).

## 7. Generation flow (polling)

### `POST /api/generations`

Request: `multipart/form-data` with `image` (file) + `format` + `style` +
`background` + `instructions` (optional).

1. **Authenticated?** No → `401`.
2. **Valid image?** mime ∈ {`image/jpeg`, `image/png`, `image/webp`},
   size ≤ `MAX_UPLOAD_MB` (env, default 10). Invalid → `422`.
3. **Valid options?** `format`/`style`/`background` in the catalogs →
   else `422`.
4. **No concurrent job?** If the user has a `Generation` with
   `status = pending` created < 5 minutes ago → `409
   { code: "GENERATION_IN_PROGRESS" }`. (Backend counterpart to the
   disabled button.)
5. **Has credits?** `getCredits(userId)`. If `0` → `403
   { code: "NO_CREDITS" }`.
6. Create `Generation(status = pending)`. Store the original image via
   `Storage.put("<id>/original.<ext>", …)`; set `originalImageUrl`.
7. `buildPrompt(...)` → `provider.createJob(...)` → save `providerJobId`
   and the `prompt`. Respond `201 { id }`.

If step 7 throws, mark the generation `failed` with the error and respond
`502`. No credit was touched.

### `GET /api/generations/:id`  (client polls every ~2s)

1. **Authenticated?** No → `401`.
2. **Owned by caller?** `generation.userId === session.userId` — else
   `404` (not `403`, to avoid leaking existence).
3. If `status === "pending"`: call `provider.getJob(providerJobId)`:
   - `completed` → download the result image (Kie URLs expire ~24h),
     `Storage.put("<id>/generated.png", …)`, run the transaction from §6
     (`pending → completed` + credit decrement), respond
     `{ status: "completed", generatedImageUrl, creditsRemaining }`.
   - `failed` → set `status = failed`, `error`; **no decrement**; respond
     `{ status: "failed", error }`.
   - `pending` → respond `{ status: "pending" }`.
4. If already `completed` / `failed`: respond with the stored record
   (+ current `creditsRemaining` for `completed`).

The credit is decremented **exactly once**, guarded by the status check
inside the transaction.

### `GET /api/media/:id/:kind`  (`kind` ∈ `original` | `generated`)

Serves image bytes from the Storage layer. **Ownership-checked**: the
generation must belong to the session user, else `404`. `?download=1`
sets `Content-Disposition: attachment`. Used by `<img>` (cookie sent
automatically) and the Download button.

### `POST /api/feedback`

Body (zod): `{ name, email, thoughts, nextIdeas }`. Authenticated. Server
POSTs to `https://formsubmit.co/ajax/${FORMSUBMIT_EMAIL}` as JSON.
Respond `{ ok: true }` on success. `FORMSUBMIT_EMAIL` is server-only.
(FormSubmit requires a one-time activation on first send — noted in the
README.) Feedback is **not** stored in PostgreSQL.

## 8. Routes & screens

| Route | Purpose | Access |
|---|---|---|
| `/` | Tool landing: wordmark "Novalup AI — Product Photos", headline ("Turn your product photos into professional marketing images with AI"), subheadline, primary CTA "Creá tu primera foto de producto", a small before/after demo (reuses `public/images/featured-product/before.jpg` + `after.jpg` from the current repo), Login / Sign up links | public; if authenticated → redirect `/app` |
| `/login` | Email + password form · "Continuar con Google" | public |
| `/signup` | Name, Email, Password, Confirm password · "Continuar con Google" | public |
| `/app` | The tool (below) | protected (middleware) |
| `/api/auth/[...nextauth]` | Auth.js handler | — |
| `/api/auth/signup` | Email/password registration (create user, hash password, seed credits) | public, rate-limited by basic validation |
| `/api/generations`, `/api/generations/[id]` | create / poll | JSON session |
| `/api/feedback` | FormSubmit proxy | JSON session |
| `/api/media/[id]/[kind]` | serve original/generated image, ownership-checked | session + ownership |

`middleware.ts` protects `/app` (redirect to `/login`). `/`, `/login`,
`/signup` redirect to `/app` when a session exists.

### `/app` — minimal dashboard (§16)

Header: `Novalup AI` wordmark · `N credits` (live, from DB) · user avatar
menu (name, email, "Cerrar sesión"). No sidebar, no extra nav.

Single-column body:

```
Título:    "Creá una foto de producto"
Subtítulo: "Subí tu producto y dejá que la IA cree una imagen de marketing profesional."

Step 1 — Upload
  Drag & drop area (JPG/JPEG/PNG/WEBP), click-to-browse fallback.
  Local preview (URL.createObjectURL) — no upload happens yet.

Step 2 — Options (shown after an image is selected)
  Formato:       [ 1:1 ] [ 4:5 ] [ 9:16 ] [ 16:9 ]      (segmented buttons)
  Estilo:        [ Studio ] [ Lifestyle ] [ Luxury ] [ Minimal ] [ Social Media ]
  Fondo:         [ Clean ] [ Premium ] [ Natural ] [ Custom ]
  Instrucciones adicionales:  textarea, optional
    placeholder: "¿Algo más que quieras que la IA tenga en cuenta?"

Step 3 — Generate
  [ Generar foto ]  → while running: "Creando tu foto de producto…"
  Button disabled + no concurrent submits. Client polls the status endpoint.

Step 4 — Result
  Large generated image
  [ Generar de nuevo ]  [ Descargar ]  [ Crear otra ]
  "1 crédito usado · Te quedan N créditos"
```

### Out of credits (§10 / §11)

When `credits === 0`, the tool does **not** show a bare error. It shows a
card / modal:

```
Título:   "Te quedaste sin créditos gratis"
Texto:    "Usaste todas tus generaciones gratuitas.
           Estamos trabajando en una forma de que sigas creando más fotos de producto."

Contanos qué te pareció
  Name
  Email
  ¿Qué te pareció la herramienta?          (textarea)
  ¿Qué te gustaría generar después?        (textarea)
  [ Enviar feedback ]

→ after submit: "¡Gracias por tu feedback! Te avisamos cuando haya más créditos disponibles."
```

Name/Email prefilled from the session. The form posts to `/api/feedback`.
The same card is what the client shows if `POST /api/generations` returns
`403 NO_CREDITS`.

## 9. Design / UX (§15)

Inherits the brand from `packages/brand` (dark `night` surfaces, `accent`
red, Inter). Premium, minimal, generous whitespace, soft radii, modern
cards, discreet microinteractions, strong responsive behavior. No
corporate dashboard, no tables, no multi-option sidebar, no clutter. The
tool must feel like: **Upload → Choose style → Generate → Download.**

Shared UI primitives live in `apps/product-photos/src/components/ui`
(`Button`, `Card`, `Field`, `SegmentedControl`, `Spinner`) — app-local,
not promoted to a package yet.

## 10. Security (§17)

- Backend auth on every route (`requireUser()` in handlers; middleware for
  pages).
- Resource authorization: `/api/generations/:id` and `/api/media/*` check
  `generation.userId === session.userId`; a mismatch returns `404`.
- Input validation with zod on every route; image type + size limits
  enforced server-side; `format`/`style`/`background` validated against
  the catalogs.
- `KIE_API_KEY` and `FORMSUBMIT_EMAIL` are server-only — never
  `NEXT_PUBLIC_`, never sent to the browser.
- Credits are always checked and mutated server-side, in a transaction.
- No trust in client values: the client cannot set credits, cannot pick
  an arbitrary aspect ratio string, cannot read another user's media.
- Passwords hashed with `bcryptjs` (cost 10). Signup validates password
  length (≥ 8) and confirm-match.

## 11. Docker

`docker-compose.yml`:

- **postgres** — `postgres:16-alpine`, env `POSTGRES_USER/PASSWORD/DB`,
  named volume `pgdata`, healthcheck (`pg_isready`).
- **product-photos** — built from `apps/product-photos/Dockerfile`
  (multi-stage: `node:20-alpine`, `corepack` pnpm, workspace-aware
  install, `next build` with `output: "standalone"`). `depends_on:
  postgres (healthy)`. Ports `3000:3000`. Named volume `media` mounted at
  `/data` (= `STORAGE_DIR`). Entry: run `prisma migrate deploy`, then
  `node server.js`.

`apps/web` is **not** in Compose — run it with `pnpm --filter web dev`
when needed.

`docker compose up --build` brings up Postgres + the app, applies
migrations, and serves the tool at `http://localhost:3000`.

`.env.example` (root):

```
# Database (compose network host = "postgres")
DATABASE_URL=postgresql://novalup:novalup@postgres:5432/product_photos

# Auth
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Kie.ai (Nano Banana 2)
KIE_API_KEY=

# Feedback
FORMSUBMIT_EMAIL=

# Credits & limits
FREE_CREDITS=3
MAX_UPLOAD_MB=10

# Storage (Docker volume path)
STORAGE_DIR=/data

# Link from the marketing homepage to this app
NEXT_PUBLIC_PRODUCT_PHOTOS_URL=http://localhost:3000
```

`README.md` documents, in order:

1. `cp .env.example .env` and fill values.
2. Create Google OAuth credentials (redirect URI
   `http://localhost:3000/api/auth/callback/google`) → set
   `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.
3. Get a Kie.ai API key → set `KIE_API_KEY`.
4. Set `FORMSUBMIT_EMAIL` (and activate FormSubmit on first feedback
   send).
5. `docker compose up --build`.
6. Migrations run automatically in the entrypoint; to run them manually:
   `docker compose run --rm product-photos pnpm prisma migrate deploy`.
   Generate a dev migration locally with `pnpm --filter product-photos
   prisma migrate dev`.

No external services beyond Postgres, Google OAuth, Kie.ai, and
FormSubmit.

## 12. Testing / verification

- **Vitest** in `apps/product-photos` for pure logic:
  - `prompt.ts` — every style/background combination assembles the
    expected sections; instructions appended when present.
  - `credits/service.ts` — `consumeOneCredit` decrements once; is a no-op
    when the generation is not `pending`; does not go below 0.
  - `validation/schemas.ts` — signup (password rules, confirm match),
    generation input (catalog membership), feedback.
  - `options.ts` — format → aspect ratio map.
- `tsc --noEmit` and `next lint` clean for both apps.
- Manual QA of the full flow (§13 below) at mobile (375px) and desktop
  widths.
- `pnpm --filter web build` clean + homepage smoke check (the move did
  not regress anything).

## 13. End-to-end flow the MVP delivers

```
Landing (/)
  → Sign up / Login  (email/password or Google)
  → 3 free credits granted
  → /app: upload product image (preview)
  → choose format / style / background / (optional) instructions
  → Generar foto → poll → Nano Banana 2 via Kie.ai
  → large result → Descargar
  → Crear otra … repeat until credits = 0
  → out-of-credits card + feedback form (FormSubmit)
  → "¡Gracias por tu feedback!"
```

Every generation is persisted in `Generation` (status `pending` →
`completed` / `failed`) for later analysis. No history UI is built.

## 14. Explicitly deferred

- Payments in any form (Stripe, Mercado Pago), plans, subscriptions,
  credit packs, coupons, checkout, billing.
- Admin panel, advanced analytics, referrals, teams/collaboration, email
  marketing, notification system, CMS, blog, marketplace.
- Multiple AI providers (the `ProductPhotoProvider` interface exists;
  only the Kie implementation ships).
- Cloud object storage (the `Storage` interface exists; only
  `LocalStorage` ships).
- Image editor, video generation, public API, mobile app.
- Sophisticated password recovery, email verification, complex roles,
  organizations, invitations. (`User` shape leaves room for them.)
- A generation-history screen.
- Putting `apps/web` in Docker Compose.
- Turborepo, a shared `packages/db` or `packages/ui`.

## 15. Spec self-review

- **Placeholders:** none — every section is concrete.
- **Consistency:** ports (3000), model id (`nano-banana-2`), status enum
  (`pending|completed|failed`), and the credit-decrement rule are stated
  once and referenced consistently. `FREE_CREDITS` handling is defined in
  one place (§6) and referenced from §7/§8.
- **Scope:** single implementation plan's worth of work — one app plus a
  mechanical monorepo move. No decomposition needed.
- **Ambiguity resolved:** generation delivery is polling (not webhook,
  not one long request); feedback goes through a server proxy (not a
  client-side FormSubmit post); Docker runs the app in production mode
  (not bind-mounted dev); the tool app is Spanish-only with a centralized
  copy module (not `next-intl`, not English).
