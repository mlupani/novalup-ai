# Product Photos MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a small AI Product Photos MVP — sign up, get free credits, upload a product, generate a marketing image with Kie.ai (Nano Banana 2), download it, and hit a feedback form when credits run out.

**Architecture:** Convert the repo to a pnpm-workspaces monorepo: the current homepage moves to `apps/web`, the new tool is `apps/product-photos`, and one shared package `packages/brand` holds the Tailwind preset. The tool is a Next.js 16 App Router app with Auth.js (Google + email/password), Prisma/PostgreSQL, a `Storage` abstraction over a local Docker volume, and a `ProductPhotoProvider` abstraction over Kie.ai. Generation is asynchronous: the client polls a status endpoint that in turn polls Kie. A credit is consumed exactly once, only on the `pending → completed` transition, inside a DB transaction. Everything runs locally via `docker compose up --build`.

**Tech Stack:** pnpm workspaces, Next.js 16 (App Router), TypeScript, Tailwind CSS v3, Prisma + PostgreSQL, `next-auth@5` (Auth.js) + `@auth/prisma-adapter`, `bcryptjs`, `zod`, Vitest, Docker Compose.

**Spec:** `docs/superpowers/specs/2026-09-06-product-photos-mvp-design.md` — read it alongside this plan.

## Global Constraints

- **Package manager:** pnpm, workspaces. Root is private. Add `"packageManager"` and `"engines": { "node": ">=20" }` to the root `package.json`.
- **Tool app language:** Spanish only. No `next-intl`. Every user-facing string lives in `apps/product-photos/src/content/copy.ts`.
- **Ports:** `apps/web` dev = `3100` (unchanged). `apps/product-photos` = `3000` in dev and in Docker.
- **Model id:** `nano-banana-2` (env `KIE_MODEL`, default `nano-banana-2`).
- **Generation status enum:** exactly `pending | completed | failed`.
- **Credit rule:** verify `credits > 0` server-side before generating; decrement by 1 **only** on a successful generation, in a transaction; **never** decrement on failure. Never trust the client for credits — always read from the DB.
- **`FREE_CREDITS`:** `Number(process.env.FREE_CREDITS ?? 3)`, defined once in `apps/product-photos/src/lib/credits/config.ts`. Referenced only from the email-signup route and the Auth.js `events.createUser` hook.
- **Secrets:** `KIE_API_KEY`, `FORMSUBMIT_EMAIL`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_SECRET` are server-only. Never prefix them `NEXT_PUBLIC_`. Never import the Kie provider or these envs from a React component.
- **Out of credits:** the backend rejects `POST /api/generations` with HTTP `403` and body `{ "code": "NO_CREDITS" }`; the frontend then shows the feedback card (not a bare error).
- **Resource authorization:** `/api/generations/:id` and `/api/media/:id/:kind` must verify `generation.userId === session.userId`; a mismatch returns `404` (not `403`).
- **Image limits:** accept only `image/jpeg`, `image/png`, `image/webp`; max size `MAX_UPLOAD_MB` (env, default `10`).
- **Commit style:** frequent, one per task step group. End every commit message body with:
  ```
  Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_019MqwHsHqF9KBb73q3SB7DX
  ```
- **Do NOT build** (reject scope creep): payments, Stripe, Mercado Pago, plans, subscriptions, credit packs, coupons, billing, admin, analytics, referrals, teams, notifications, CMS, blog, marketplace, a second AI provider, cloud storage, an image editor, video, a public API, a mobile app, password recovery, email verification, roles, a generation-history screen, `apps/web` in Docker, Turborepo, shared `packages/db` or `packages/ui`.

---

## File Structure

### Monorepo root (new / changed)

| Path | Responsibility |
|---|---|
| `package.json` | Root workspace: private, `packageManager`, `engines`, delegating scripts (`dev:web`, `dev:photos`, `build`, `lint`, `typecheck`, `test`). No app dependencies. |
| `pnpm-workspace.yaml` | `packages: [apps/*, packages/*]` |
| `tsconfig.base.json` | Shared compiler options; apps `extends` it. |
| `.gitignore` | Add `apps/*/.next`, `apps/*/node_modules`, `packages/*/node_modules`, `apps/product-photos/.data`, `.env`. |
| `.dockerignore` | Exclude `node_modules`, `.next`, `.git`, `.data`, `**/*.md` (keep none of the build cruft). |
| `docker-compose.yml` | `postgres` + `product-photos` services. |
| `.env.example` | All env vars (see spec §11). |
| `README.md` | Run instructions (6 steps). |

### `packages/brand`

| Path | Responsibility |
|---|---|
| `packages/brand/package.json` | `name: "@novalup/brand"`, `private`, exports `./tailwind-preset`. |
| `packages/brand/tailwind-preset.ts` | Tailwind `Config` fragment: `night`/`accent` color scales, `fontFamily.sans` with `--font-inter`, `float`/`float-sm` keyframes + animations. |

### `apps/web` (moved verbatim, 2 config edits)

All current root files move under `apps/web/`. Only `tailwind.config.ts` (use the preset) and `tsconfig.json` (`extends` the base) change. Plus the `/product-photos` placeholder + CTAs point at `NEXT_PUBLIC_PRODUCT_PHOTOS_URL`.

### `apps/product-photos`

| Path | Responsibility |
|---|---|
| `package.json` | App deps + scripts (`dev -p 3000`, `build`, `start -p 3000`, `lint`, `typecheck`, `test`, `prisma:migrate`, `prisma:studio`). |
| `next.config.ts` | `transpilePackages: ["@novalup/brand"]`. |
| `tsconfig.json` | `extends ../../tsconfig.base.json`, `paths` `@/*` → `./src/*`. |
| `tailwind.config.ts` | `presets: [brandPreset]`, `content` glob. |
| `postcss.config.mjs` | tailwind + autoprefixer. |
| `vitest.config.ts` | node environment, `@/` alias. |
| `.env` (gitignored) | local dev values. |
| `Dockerfile` | multi-stage build; runner does `prisma migrate deploy` + `next start`. |
| `docker-entrypoint.sh` | `prisma migrate deploy` then `node server.js`. |
| `prisma/schema.prisma` | datasource + `User`/`Account`/`Session`/`VerificationToken`/`Generation` + `GenerationStatus`. |
| `prisma/migrations/**` | generated. |
| `src/types/next-auth.d.ts` | augment `Session.user.id`, `JWT.userId`. |
| `src/content/copy.ts` | every Spanish UI string. |
| `src/lib/db/client.ts` | `PrismaClient` singleton. |
| `src/lib/credits/config.ts` | `FREE_CREDITS`. |
| `src/lib/credits/service.ts` | `getCredits`, `grantFreeCredits`, `consumeOneCredit`. |
| `src/lib/auth/password.ts` | `hashPassword`, `verifyPassword` (bcryptjs). |
| `src/lib/auth/auth.ts` | Auth.js config: `handlers`, `auth`, `signIn`, `signOut`. |
| `src/lib/auth/session.ts` | `requireUser()` for route handlers. |
| `src/lib/validation/schemas.ts` | zod: `signupSchema`, `loginSchema`, `generationInputSchema`, `feedbackSchema`. |
| `src/lib/validation/upload.ts` | `ALLOWED_IMAGE_TYPES`, `MAX_UPLOAD_BYTES`, `assertValidImage`. |
| `src/lib/storage/index.ts` | `Storage` interface + `storage` singleton export. |
| `src/lib/storage/local.ts` | `LocalStorage` (fs, `STORAGE_DIR`). |
| `src/lib/ai/options.ts` | `FORMATS`, `STYLES`, `BACKGROUNDS`, `formatToAspectRatio`. |
| `src/lib/ai/prompt.ts` | `buildPrompt(input)`. |
| `src/lib/ai/product-photo-provider.ts` | `ProductPhotoProvider` interface + `JobResult` type + `provider` singleton export. |
| `src/lib/ai/kie-provider.ts` | `KieProvider` implements `ProductPhotoProvider`. |
| `src/lib/feedback/formsubmit.ts` | `submitFeedback(payload)`. |
| `src/middleware.ts` | cookie-based redirects for `/`, `/login`, `/signup`, `/app/*`. |
| `src/app/layout.tsx` | root html/body, Inter font, `<html lang="es">`. |
| `src/app/globals.css` | tailwind layers. |
| `src/app/page.tsx` | landing. |
| `src/app/login/page.tsx` · `src/app/signup/page.tsx` | auth screens. |
| `src/app/app/layout.tsx` | server-side `auth()` guard + dashboard header. |
| `src/app/app/page.tsx` | the tool (client orchestrator). |
| `src/app/api/auth/[...nextauth]/route.ts` | Auth.js handlers. |
| `src/app/api/auth/signup/route.ts` | email/password registration. |
| `src/app/api/generations/route.ts` | `POST` create. |
| `src/app/api/generations/[id]/route.ts` | `GET` poll. |
| `src/app/api/media/[id]/[kind]/route.ts` | ownership-checked image bytes. |
| `src/app/api/feedback/route.ts` | FormSubmit proxy. |
| `src/components/ui/*` | `Button`, `Card`, `Field`, `SegmentedControl`, `Spinner`. |
| `src/components/auth/AuthForm.tsx` · `GoogleButton.tsx` | auth UI. |
| `src/components/landing/*` | landing sections. |
| `src/components/tool/Uploader.tsx` | drag & drop + preview. |
| `src/components/tool/OptionPicker.tsx` | format/style/background/instructions. |
| `src/components/tool/GeneratePanel.tsx` | generate button + polling + loading. |
| `src/components/tool/ResultCard.tsx` | result image + download / again / another. |
| `src/components/tool/OutOfCreditsCard.tsx` | out-of-credits + `FeedbackForm`. |
| `src/components/tool/FeedbackForm.tsx` | the FormSubmit form. |
| `src/hooks/useGeneration.ts` | client polling state machine. |

---

## Phase A — Monorepo restructuring

### Task 1: Create the workspace and shared brand package

**Files:**
- Create: `pnpm-workspace.yaml`, `tsconfig.base.json`, `packages/brand/package.json`, `packages/brand/tailwind-preset.ts`
- Modify: `package.json` (root), `.gitignore`

**Interfaces:**
- Produces: `@novalup/brand/tailwind-preset` — a default-exported partial Tailwind `Config` with `theme.extend.colors.night`, `theme.extend.colors.accent`, `theme.extend.fontFamily.sans`, `theme.extend.keyframes.{float,float-sm}`, `theme.extend.animation.{float,float-sm}`. Consumed by both apps' `tailwind.config.ts` via `presets: [brandPreset]`.
- Produces: `tsconfig.base.json` at repo root — consumed by both apps via `"extends": "../../tsconfig.base.json"`.

- [ ] **Step 1: Create `pnpm-workspace.yaml`**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

- [ ] **Step 2: Create `tsconfig.base.json`**

Copy the compiler options from the current root `tsconfig.json`, minus `paths`/`plugins`/`include`/`exclude`:

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true
  }
}
```

- [ ] **Step 3: Create `packages/brand/package.json`**

```json
{
  "name": "@novalup/brand",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "tailwind-preset.ts",
  "exports": {
    "./tailwind-preset": "./tailwind-preset.ts"
  }
}
```

- [ ] **Step 4: Create `packages/brand/tailwind-preset.ts`**

Move the `theme.extend` block verbatim from the current root `tailwind.config.ts`:

```ts
import type { Config } from "tailwindcss";

const preset: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        night: { DEFAULT: "#0B0B0D", soft: "#101014", card: "#141418" },
        accent: { DEFAULT: "#e11d48", dark: "#be123c", light: "#fb7185" },
      },
      fontFamily: { sans: ["var(--font-inter)", "system-ui", "sans-serif"] },
      keyframes: {
        float: { "0%, 100%": { transform: "translateY(0px)" }, "50%": { transform: "translateY(-10px)" } },
        "float-sm": { "0%, 100%": { transform: "translateY(0px)" }, "50%": { transform: "translateY(-6px)" } },
      },
      animation: { float: "float 6s ease-in-out infinite", "float-sm": "float-sm 7s ease-in-out infinite" },
    },
  },
};

export default preset;
```

- [ ] **Step 5: Replace the root `package.json`**

```json
{
  "name": "novalup-ai",
  "version": "0.1.0",
  "private": true,
  "packageManager": "pnpm@9.12.0",
  "engines": { "node": ">=20" },
  "scripts": {
    "dev:web": "pnpm --filter web dev",
    "dev:photos": "pnpm --filter product-photos dev",
    "build": "pnpm -r build",
    "lint": "pnpm -r lint",
    "typecheck": "pnpm -r typecheck",
    "test": "pnpm -r test"
  }
}
```

(Use whatever `pnpm@` version `pnpm --version` reports on this machine.)

- [ ] **Step 6: Update `.gitignore`**

Append:

```
apps/*/.next/
apps/*/node_modules/
packages/*/node_modules/
apps/product-photos/.data/
.env
```

- [ ] **Step 7: Commit**

```bash
git add pnpm-workspace.yaml tsconfig.base.json packages/ package.json .gitignore
git commit -m "Set up pnpm workspace and @novalup/brand preset"
```

---

### Task 2: Move the homepage into `apps/web`

**Files:**
- Move: `src/` → `apps/web/src/`, `public/` → `apps/web/public/`, `next.config.ts`, `next-env.d.ts`, `postcss.config.mjs`, `eslint.config.mjs` → `apps/web/`
- Create: `apps/web/package.json`
- Modify: `apps/web/tailwind.config.ts`, `apps/web/tsconfig.json`
- Delete: root `tailwind.config.ts`, root `tsconfig.json`, root `pnpm-lock.yaml` (regenerated), root `next-env.d.ts`

**Interfaces:**
- Consumes: `@novalup/brand/tailwind-preset` (Task 1).
- Produces: nothing new — this is a lift-and-shift. The homepage's observable behavior must be unchanged.

- [ ] **Step 1: Move the files with git**

```bash
mkdir -p apps/web
git mv src apps/web/src
git mv public apps/web/public
git mv next.config.ts apps/web/next.config.ts
git mv next-env.d.ts apps/web/next-env.d.ts
git mv postcss.config.mjs apps/web/postcss.config.mjs
git mv eslint.config.mjs apps/web/eslint.config.mjs
git mv tailwind.config.ts apps/web/tailwind.config.ts
git mv tsconfig.json apps/web/tsconfig.json
```

- [ ] **Step 2: Create `apps/web/package.json`**

Move the app-level fields out of the old root package.json:

```json
{
  "name": "web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3100",
    "build": "next build",
    "start": "next start -p 3100",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "next": "^16.0.10",
    "next-intl": "^4.0.0",
    "lucide-react": "^0.469.0",
    "react": "^19.2.1",
    "react-dom": "^19.2.1"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "autoprefixer": "^10",
    "eslint": "^9",
    "eslint-config-next": "^16.0.7",
    "postcss": "^8",
    "tailwindcss": "^3.4.1",
    "typescript": "^5"
  }
}
```

- [ ] **Step 3: Point `apps/web/tailwind.config.ts` at the preset**

```ts
import type { Config } from "tailwindcss";
import brandPreset from "@novalup/brand/tailwind-preset";

const config: Config = {
  presets: [brandPreset],
  content: ["./src/**/*.{ts,tsx}"],
  plugins: [],
};

export default config;
```

- [ ] **Step 4: Make `apps/web/tsconfig.json` extend the base**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 5: Add `@novalup/brand` as a dependency of `web`**

In `apps/web/package.json` dependencies, add `"@novalup/brand": "workspace:*"`.

- [ ] **Step 6: Delete the stale root lockfile and reinstall**

```bash
rm -f pnpm-lock.yaml
pnpm install
```

- [ ] **Step 7: Verify the homepage still builds and type-checks**

Run: `pnpm --filter web typecheck && pnpm --filter web lint && pnpm --filter web build`
Expected: all clean, `next build` completes.

- [ ] **Step 8: Smoke-check in the browser**

Run: `pnpm --filter web dev` → open `http://localhost:3100/` and `http://localhost:3100/en`. Confirm the homepage renders identically (hero, product grid, footer) in both locales and `/product-photos` shows the placeholder.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "Move the homepage into apps/web"
```

---

## Phase B — Scaffold `apps/product-photos`

### Task 3: Scaffold the tool app (empty landing renders, Vitest runs)

**Files:**
- Create: `apps/product-photos/package.json`, `apps/product-photos/next.config.ts`, `apps/product-photos/tsconfig.json`, `apps/product-photos/tailwind.config.ts`, `apps/product-photos/postcss.config.mjs`, `apps/product-photos/.eslintrc.json`, `apps/product-photos/vitest.config.ts`, `apps/product-photos/src/app/layout.tsx`, `apps/product-photos/src/app/globals.css`, `apps/product-photos/src/app/page.tsx`, `apps/product-photos/src/content/copy.ts`, `apps/product-photos/.env.example`
- Test: `apps/product-photos/src/content/copy.test.ts`

**Interfaces:**
- Consumes: `@novalup/brand/tailwind-preset`.
- Produces: `@/content/copy` — a default-exported nested object `copy` of Spanish strings. Keys used by later tasks: `copy.landing.*`, `copy.auth.*`, `copy.tool.*`, `copy.credits.freeLabel(n)`, `copy.credits.remainingLabel(n)`, `copy.outOfCredits.*`, `copy.feedback.*`, `copy.errors.*`.

- [ ] **Step 1: Create `apps/product-photos/package.json`**

```json
{
  "name": "product-photos",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "prisma generate && next build",
    "start": "next start -p 3000",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "prisma:migrate": "prisma migrate dev",
    "prisma:deploy": "prisma migrate deploy",
    "prisma:studio": "prisma studio"
  },
  "dependencies": {
    "@auth/prisma-adapter": "^2.7.0",
    "@novalup/brand": "workspace:*",
    "@prisma/client": "^6.1.0",
    "bcryptjs": "^2.4.3",
    "next": "^16.0.10",
    "next-auth": "5.0.0-beta.25",
    "react": "^19.2.1",
    "react-dom": "^19.2.1",
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "autoprefixer": "^10",
    "eslint": "^9",
    "eslint-config-next": "^16.0.7",
    "postcss": "^8",
    "prisma": "^6.1.0",
    "tailwindcss": "^3.4.1",
    "typescript": "^5",
    "vitest": "^2.1.8"
  }
}
```

> At implementation time, run `pnpm --filter product-photos add <pkg>` for anything whose version above is stale, and let pnpm resolve current versions. `next-auth@5` is still beta — pin the exact beta that installs cleanly with Next 16.

- [ ] **Step 2: Create `apps/product-photos/next.config.ts`**

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@novalup/brand"],
};

export default nextConfig;
```

(No `output: "standalone"` — the Docker image in Task 28 runs `next start` with full `node_modules`, which is simpler and more robust for a monorepo MVP than wrestling with standalone file tracing.)

- [ ] **Step 3: Create `apps/product-photos/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Create `apps/product-photos/tailwind.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`**

```ts
// tailwind.config.ts
import type { Config } from "tailwindcss";
import brandPreset from "@novalup/brand/tailwind-preset";

const config: Config = {
  presets: [brandPreset],
  content: ["./src/**/*.{ts,tsx}"],
  plugins: [],
};

export default config;
```

```js
// postcss.config.mjs
export default { plugins: { tailwindcss: {}, autoprefixer: {} } };
```

```js
// eslint.config.mjs — mirror apps/web's flat config
import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextCoreWebVitals,
  ...nextTypescript,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "src/generated/**"]),
]);
```

- [ ] **Step 5: Create `apps/product-photos/vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: { environment: "node", include: ["src/**/*.test.ts"] },
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});
```

- [ ] **Step 6: Create the root layout, globals, and a placeholder landing**

```tsx
// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Novalup AI — Product Photos",
  description: "Convertí las fotos de tu producto en imágenes de marketing profesionales con IA.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="min-h-screen bg-night font-sans text-white antialiased">{children}</body>
    </html>
  );
}
```

```css
/* src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

```tsx
// src/app/page.tsx
import copy from "@/content/copy";

export default function LandingPage() {
  return <main className="p-10">{copy.landing.headline}</main>;
}
```

- [ ] **Step 7: Create `src/content/copy.ts` with the full string set**

```ts
const copy = {
  brand: { name: "Novalup AI", product: "Product Photos" },
  landing: {
    headline: "Convertí las fotos de tu producto en imágenes de marketing profesionales con IA.",
    subheadline: "Subí una foto, elegí un estilo y obtené una imagen lista para vender en segundos.",
    cta: "Creá tu primera foto de producto",
    login: "Iniciar sesión",
    signup: "Crear cuenta",
    demoBefore: "Antes",
    demoAfter: "Después",
  },
  auth: {
    loginTitle: "Iniciá sesión",
    signupTitle: "Creá tu cuenta",
    name: "Nombre",
    email: "Email",
    password: "Contraseña",
    confirmPassword: "Confirmar contraseña",
    submitLogin: "Iniciar sesión",
    submitSignup: "Crear cuenta",
    google: "Continuar con Google",
    haveAccount: "¿Ya tenés cuenta?",
    noAccount: "¿No tenés cuenta?",
    or: "o",
  },
  tool: {
    title: "Creá una foto de producto",
    subtitle: "Subí tu producto y dejá que la IA cree una imagen de marketing profesional.",
    uploadHint: "Arrastrá una imagen o hacé clic para subirla",
    uploadFormats: "JPG, PNG o WEBP · hasta 10 MB",
    changeImage: "Cambiar imagen",
    formatLabel: "Formato",
    styleLabel: "Estilo",
    backgroundLabel: "Fondo",
    instructionsLabel: "Instrucciones adicionales",
    instructionsPlaceholder: "¿Algo más que quieras que la IA tenga en cuenta?",
    formats: { "1:1": "Cuadrado 1:1", "4:5": "Retrato 4:5", "9:16": "Vertical 9:16", "16:9": "Horizontal 16:9" },
    styles: { studio: "Studio", lifestyle: "Lifestyle", luxury: "Luxury", minimal: "Minimal", "social-media": "Social Media" },
    backgrounds: { clean: "Clean", premium: "Premium", natural: "Natural", custom: "Custom" },
    generate: "Generar foto",
    generating: "Creando tu foto de producto…",
    resultTitle: "Tu foto de producto",
    generateAgain: "Generar de nuevo",
    download: "Descargar",
    createAnother: "Crear otra",
    creditUsed: (remaining: number) => `1 crédito usado · Te quedan ${remaining} créditos`,
  },
  credits: {
    freeLabel: (n: number) => `${n} créditos gratis`,
    remainingLabel: (n: number) => `${n} créditos restantes`,
  },
  outOfCredits: {
    title: "Te quedaste sin créditos gratis",
    body: "Usaste todas tus generaciones gratuitas. Estamos trabajando en una forma de que sigas creando más fotos de producto.",
  },
  feedback: {
    title: "Contanos qué te pareció",
    name: "Nombre",
    email: "Email",
    thoughts: "¿Qué te pareció la herramienta?",
    nextIdeas: "¿Qué te gustaría generar después?",
    submit: "Enviar feedback",
    sending: "Enviando…",
    thanksTitle: "¡Gracias por tu feedback!",
    thanksBody: "Te avisamos cuando haya más créditos disponibles.",
  },
  errors: {
    generic: "Algo salió mal. Probá de nuevo.",
    generationFailed: "No pudimos generar la imagen. No se descontó ningún crédito.",
    invalidImage: "El archivo debe ser JPG, PNG o WEBP y pesar menos de 10 MB.",
    inProgress: "Ya tenés una generación en curso.",
    passwordMismatch: "Las contraseñas no coinciden.",
    emailTaken: "Ya existe una cuenta con ese email.",
    invalidCredentials: "Email o contraseña incorrectos.",
  },
} as const;

export default copy;
```

- [ ] **Step 8: Write the failing test**

```ts
// src/content/copy.test.ts
import { describe, it, expect } from "vitest";
import copy from "@/content/copy";

describe("copy", () => {
  it("formats credit labels with the given number", () => {
    expect(copy.credits.freeLabel(3)).toBe("3 créditos gratis");
    expect(copy.credits.remainingLabel(2)).toBe("2 créditos restantes");
  });
  it("formats the credit-used line with the remaining count", () => {
    expect(copy.tool.creditUsed(1)).toContain("Te quedan 1");
  });
});
```

- [ ] **Step 9: Run tests**

Run: `pnpm --filter product-photos test`
Expected: PASS (copy is already written).

- [ ] **Step 10: Create `apps/product-photos/.env.example`** (local-dev values; the root `.env.example` for Docker Compose is added in Task 29)

```
DATABASE_URL=postgresql://novalup:novalup@localhost:5432/product_photos
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
AUTH_TRUST_HOST=true
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
KIE_API_KEY=
KIE_BASE_URL=https://api.kie.ai
KIE_UPLOAD_URL=https://kieai.redpandaai.co/api/file-stream-upload
KIE_MODEL=nano-banana-2
KIE_RESOLUTION=2K
FORMSUBMIT_EMAIL=
FREE_CREDITS=3
MAX_UPLOAD_MB=10
STORAGE_DIR=./.data
NEXT_PUBLIC_PRODUCT_PHOTOS_URL=http://localhost:3000
```

- [ ] **Step 11: Install and verify dev server + typecheck**

Run: `pnpm install` (updates the root `pnpm-lock.yaml` with the new app's deps — it must be committed for the Docker `--frozen-lockfile` build).
Run: `pnpm --filter product-photos typecheck` → clean.
Run: `pnpm --filter product-photos dev` → `http://localhost:3000/` shows the headline text.

- [ ] **Step 12: Commit**

```bash
git add apps/product-photos pnpm-lock.yaml
git commit -m "Scaffold apps/product-photos (landing shell, copy module, Vitest)"
```

> **Rule for the rest of the plan:** any task that adds a dependency (`pnpm --filter product-photos add ...`) must `git add pnpm-lock.yaml` in its commit.

---

## Phase C — Data model and core libraries

### Task 4: Prisma schema, migration, and client singleton

**Files:**
- Create: `apps/product-photos/prisma/schema.prisma`, `apps/product-photos/src/lib/db/client.ts`, `apps/product-photos/src/types/next-auth.d.ts`
- Modify: `apps/product-photos/.env` (create locally with a `DATABASE_URL` to a running Postgres)

**Interfaces:**
- Produces: `@/lib/db/client` → `export const prisma: PrismaClient`.
- Produces: Prisma models `User`, `Account`, `Session`, `VerificationToken`, `Generation`; enum `GenerationStatus` (`pending | completed | failed`).

- [ ] **Step 1: Write `prisma/schema.prisma`**

Use the exact schema from spec §4. Header:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Then the five models and the enum exactly as in the spec (`User` with `credits Int @default(0)`, `Generation` with `@@index([userId])`, `@@index([createdAt])`, `@@index([userId, status])`).

> If Prisma 6 + Next 16 (Turbopack) fails to resolve the default `node_modules/@prisma/client` at build time, add `output = "../src/generated/prisma"` to the generator block and change `src/lib/db/client.ts` to `import { PrismaClient } from "@/generated/prisma"`. The `src/generated/**` path is already in the eslint ignores. Nothing else changes.

- [ ] **Step 2: Create `src/lib/db/client.ts`**

```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 3: Create `src/types/next-auth.d.ts`**

```ts
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: { id: string } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
  }
}
```

- [ ] **Step 4: Start a local Postgres and set `DATABASE_URL`**

```bash
docker run --rm -d --name pp-pg -e POSTGRES_USER=novalup -e POSTGRES_PASSWORD=novalup -e POSTGRES_DB=product_photos -p 5432:5432 postgres:16-alpine
```

Put `DATABASE_URL=postgresql://novalup:novalup@localhost:5432/product_photos` in `apps/product-photos/.env`.

- [ ] **Step 5: Generate the first migration**

Run: `pnpm --filter product-photos exec prisma migrate dev --name init`
Expected: creates `prisma/migrations/*_init/migration.sql`, applies it, runs `prisma generate`.

- [ ] **Step 6: Verify the client compiles**

Run: `pnpm --filter product-photos typecheck`
Expected: clean (the `@prisma/client` types now exist).

- [ ] **Step 7: Commit**

```bash
git add apps/product-photos/prisma apps/product-photos/src/lib/db apps/product-photos/src/types
git commit -m "Add Prisma schema, init migration, and client singleton"
```

---

### Task 5: Generation option catalogs

**Files:**
- Create: `apps/product-photos/src/lib/ai/options.ts`
- Test: `apps/product-photos/src/lib/ai/options.test.ts`

**Interfaces:**
- Produces:
  - `FORMATS: ReadonlyArray<{ id: FormatId; aspectRatio: AspectRatio }>` where `FormatId = "1:1" | "4:5" | "9:16" | "16:9"` and `AspectRatio` is the same union.
  - `STYLES: readonly StyleId[]` where `StyleId = "studio" | "lifestyle" | "luxury" | "minimal" | "social-media"`.
  - `BACKGROUNDS: readonly BackgroundId[]` where `BackgroundId = "clean" | "premium" | "natural" | "custom"`.
  - `formatToAspectRatio(id: string): AspectRatio | null`.
  - `isStyleId`, `isBackgroundId`, `isFormatId` type-guard helpers.
- Human-readable labels for these ids are **not** here — they live in `copy.tool.formats` / `copy.tool.styles` / `copy.tool.backgrounds` (Global Constraint: all UI copy in `copy.ts`).

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/ai/options.test.ts
import { describe, it, expect } from "vitest";
import { FORMATS, STYLES, BACKGROUNDS, formatToAspectRatio, isStyleId, isFormatId } from "@/lib/ai/options";

describe("options", () => {
  it("exposes the four formats mapped to Kie aspect ratios", () => {
    expect(FORMATS.map((f) => f.id)).toEqual(["1:1", "4:5", "9:16", "16:9"]);
    expect(FORMATS.every((f) => f.aspectRatio === f.id)).toBe(true);
    expect(formatToAspectRatio("9:16")).toBe("9:16");
    expect(formatToAspectRatio("bogus")).toBeNull();
  });
  it("lists the five styles and four backgrounds", () => {
    expect(STYLES).toEqual(["studio", "lifestyle", "luxury", "minimal", "social-media"]);
    expect(BACKGROUNDS).toEqual(["clean", "premium", "natural", "custom"]);
  });
  it("type guards reject unknown ids", () => {
    expect(isStyleId("studio")).toBe(true);
    expect(isStyleId("vaporwave")).toBe(false);
    expect(isFormatId("1:1")).toBe(true);
  });
});
```

- [ ] **Step 2: Run test → FAIL** (`Cannot find module '@/lib/ai/options'`).

Run: `pnpm --filter product-photos test -- options`

- [ ] **Step 3: Implement `src/lib/ai/options.ts`**

```ts
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
```

- [ ] **Step 4: Run test → PASS.** Run: `pnpm --filter product-photos test -- options`

- [ ] **Step 5: Commit**

```bash
git add apps/product-photos/src/lib/ai/options.ts apps/product-photos/src/lib/ai/options.test.ts
git commit -m "Add generation option catalogs"
```

---

### Task 6: Internal prompt builder

**Files:**
- Create: `apps/product-photos/src/lib/ai/prompt.ts`
- Test: `apps/product-photos/src/lib/ai/prompt.test.ts`

**Interfaces:**
- Consumes: `StyleId`, `BackgroundId` from `@/lib/ai/options`.
- Produces: `buildPrompt(input: { style: StyleId; background: BackgroundId; instructions?: string | null }): string`.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/ai/prompt.test.ts
import { describe, it, expect } from "vitest";
import { buildPrompt } from "@/lib/ai/prompt";

describe("buildPrompt", () => {
  it("always includes the product-preservation block", () => {
    const p = buildPrompt({ style: "studio", background: "clean" });
    expect(p).toMatch(/preserve the exact product identity/i);
    expect(p).toMatch(/preserve .*colors/i);
    expect(p).toMatch(/labels and packaging/i);
    expect(p).toMatch(/photorealistic/i);
  });
  it("adds a style-specific section", () => {
    expect(buildPrompt({ style: "studio", background: "clean" })).toMatch(/studio/i);
    expect(buildPrompt({ style: "lifestyle", background: "natural" })).toMatch(/scene|in use|environment/i);
    expect(buildPrompt({ style: "luxury", background: "premium" })).toMatch(/editorial|premium/i);
    expect(buildPrompt({ style: "minimal", background: "clean" })).toMatch(/negative space|clean|minimal/i);
  });
  it("appends additional instructions verbatim when present", () => {
    const p = buildPrompt({ style: "studio", background: "clean", instructions: "Place it on a marble table." });
    expect(p).toContain("Place it on a marble table.");
  });
  it("omits the instructions section when empty", () => {
    const p = buildPrompt({ style: "studio", background: "clean", instructions: "   " });
    expect(p).not.toMatch(/additional instructions/i);
  });
});
```

- [ ] **Step 2: Run test → FAIL.** Run: `pnpm --filter product-photos test -- prompt`

- [ ] **Step 3: Implement `src/lib/ai/prompt.ts`**

```ts
import type { StyleId, BackgroundId } from "@/lib/ai/options";

const BASE = [
  "Create a professional commercial product photograph from the provided product image.",
  "Preserve the exact product identity. Preserve its shape, proportions, colors, branding, labels and packaging.",
  "Do not invent, add, or modify important product details.",
  "Make the product the clear visual focus. Use realistic lighting, realistic shadows, and natural materials.",
  "High-end commercial photography. Photorealistic result.",
].join(" ");

const STYLE_BLOCKS: Record<StyleId, string> = {
  studio: "Style: clean professional studio product photography on a seamless backdrop with controlled, even lighting.",
  lifestyle: "Style: lifestyle photography — place the product naturally in a realistic scene or environment where it would be used, with soft natural light.",
  luxury: "Style: premium editorial aesthetic — refined styling, elegant composition, dramatic directional light, high-end magazine feel.",
  minimal: "Style: minimal modern composition — lots of negative space, a single light direction, restrained palette.",
  "social-media": "Style: bold, high-contrast, thumb-stopping framing optimized for social media feeds.",
};

const BACKGROUND_BLOCKS: Record<BackgroundId, string> = {
  clean: "Background: a clean, uncluttered neutral surface that keeps all attention on the product.",
  premium: "Background: a premium tactile setting — subtle textures such as stone, brushed metal, or fine fabric.",
  natural: "Background: a natural setting with organic materials, plants, wood, or daylight.",
  custom: "Background: follow the additional instructions for the setting.",
};

export function buildPrompt(input: {
  style: StyleId;
  background: BackgroundId;
  instructions?: string | null;
}): string {
  const parts = [BASE, STYLE_BLOCKS[input.style], BACKGROUND_BLOCKS[input.background]];
  const extra = input.instructions?.trim();
  if (extra) parts.push(`Additional instructions: ${extra}`);
  return parts.join("\n\n");
}
```

- [ ] **Step 4: Run test → PASS.** Run: `pnpm --filter product-photos test -- prompt`

- [ ] **Step 5: Commit**

```bash
git add apps/product-photos/src/lib/ai/prompt.ts apps/product-photos/src/lib/ai/prompt.test.ts
git commit -m "Add internal prompt builder for Nano Banana 2"
```

---

### Task 7: Credits config and service

**Files:**
- Create: `apps/product-photos/src/lib/credits/config.ts`, `apps/product-photos/src/lib/credits/service.ts`
- Test: `apps/product-photos/src/lib/credits/service.test.ts`

**Interfaces:**
- Produces:
  - `FREE_CREDITS: number` from `@/lib/credits/config`.
  - `getCredits(userId: string): Promise<number>` — reads `User.credits` from the DB (throws if the user is missing).
  - `grantFreeCredits(userId: string): Promise<void>` — sets `credits = FREE_CREDITS`.
  - `consumeOneCredit(tx: Prisma.TransactionClient, userId: string): Promise<boolean>` — `UPDATE ... SET credits = credits - 1 WHERE id = ? AND credits > 0`; returns `true` iff a row changed.
- Consumes: `prisma` from `@/lib/db/client` (mocked in tests).

- [ ] **Step 1: Write `src/lib/credits/config.ts`**

```ts
export const FREE_CREDITS = Number(process.env.FREE_CREDITS ?? 3);
```

- [ ] **Step 2: Write the failing test** (mock the prisma client)

```ts
// src/lib/credits/service.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const updateMany = vi.fn();
const update = vi.fn();
const findUniqueOrThrow = vi.fn();

vi.mock("@/lib/db/client", () => ({
  prisma: { user: { updateMany, update, findUniqueOrThrow } },
}));

import { getCredits, grantFreeCredits, consumeOneCredit } from "@/lib/credits/service";
import { FREE_CREDITS } from "@/lib/credits/config";

beforeEach(() => {
  updateMany.mockReset();
  update.mockReset();
  findUniqueOrThrow.mockReset();
});

describe("credits service", () => {
  it("getCredits returns the stored balance", async () => {
    findUniqueOrThrow.mockResolvedValue({ credits: 2 });
    expect(await getCredits("u1")).toBe(2);
  });

  it("grantFreeCredits sets credits to FREE_CREDITS", async () => {
    update.mockResolvedValue({});
    await grantFreeCredits("u1");
    expect(update).toHaveBeenCalledWith({ where: { id: "u1" }, data: { credits: FREE_CREDITS } });
  });

  it("consumeOneCredit returns true when a row was decremented", async () => {
    const tx = { user: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) } };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(await consumeOneCredit(tx as any, "u1")).toBe(true);
    expect(tx.user.updateMany).toHaveBeenCalledWith({
      where: { id: "u1", credits: { gt: 0 } },
      data: { credits: { decrement: 1 } },
    });
  });

  it("consumeOneCredit returns false when the balance was already 0", async () => {
    const tx = { user: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) } };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(await consumeOneCredit(tx as any, "u1")).toBe(false);
  });
});
```

- [ ] **Step 3: Run test → FAIL.** Run: `pnpm --filter product-photos test -- credits`

- [ ] **Step 4: Implement `src/lib/credits/service.ts`**

```ts
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import { FREE_CREDITS } from "@/lib/credits/config";

export async function getCredits(userId: string): Promise<number> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { credits: true },
  });
  return user.credits;
}

export async function grantFreeCredits(userId: string): Promise<void> {
  await prisma.user.update({ where: { id: userId }, data: { credits: FREE_CREDITS } });
}

export async function consumeOneCredit(
  tx: Prisma.TransactionClient,
  userId: string,
): Promise<boolean> {
  const res = await tx.user.updateMany({
    where: { id: userId, credits: { gt: 0 } },
    data: { credits: { decrement: 1 } },
  });
  return res.count === 1;
}
```

- [ ] **Step 5: Run test → PASS.** Run: `pnpm --filter product-photos test -- credits`

- [ ] **Step 6: Commit**

```bash
git add apps/product-photos/src/lib/credits
git commit -m "Add credits config and service"
```

---

### Task 8: Validation schemas and upload limits

**Files:**
- Create: `apps/product-photos/src/lib/validation/schemas.ts`, `apps/product-photos/src/lib/validation/upload.ts`
- Test: `apps/product-photos/src/lib/validation/schemas.test.ts`, `apps/product-photos/src/lib/validation/upload.test.ts`

**Interfaces:**
- Produces from `@/lib/validation/schemas`:
  - `signupSchema` → `{ name: string(≥2); email: string.email; password: string(≥8); confirmPassword: string }` with a refinement that `password === confirmPassword` (error keyed to `confirmPassword`).
  - `loginSchema` → `{ email: string.email; password: string(min 1) }`.
  - `generationInputSchema` → `{ format: FormatId; style: StyleId; background: BackgroundId; instructions: string.max(1000).optional() }` (uses the `isFormatId`/`isStyleId`/`isBackgroundId` guards via `z.string().refine`).
  - `feedbackSchema` → `{ name: string(≥1); email: string.email; thoughts: string(≥1).max(2000); nextIdeas: string(≥1).max(2000) }`.
- Produces from `@/lib/validation/upload`:
  - `ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const`.
  - `MAX_UPLOAD_BYTES: number` = `Number(process.env.MAX_UPLOAD_MB ?? 10) * 1024 * 1024`.
  - `assertValidImage(file: { type: string; size: number }): { ok: true } | { ok: false; reason: "type" | "size" }`.

- [ ] **Step 1: Write the failing tests**

```ts
// src/lib/validation/schemas.test.ts
import { describe, it, expect } from "vitest";
import { signupSchema, generationInputSchema, feedbackSchema } from "@/lib/validation/schemas";

describe("signupSchema", () => {
  it("rejects mismatched passwords", () => {
    const r = signupSchema.safeParse({ name: "Ana", email: "a@b.com", password: "12345678", confirmPassword: "99999999" });
    expect(r.success).toBe(false);
  });
  it("accepts a valid signup", () => {
    const r = signupSchema.safeParse({ name: "Ana", email: "a@b.com", password: "12345678", confirmPassword: "12345678" });
    expect(r.success).toBe(true);
  });
});

describe("generationInputSchema", () => {
  it("rejects an unknown style", () => {
    expect(generationInputSchema.safeParse({ format: "1:1", style: "nope", background: "clean" }).success).toBe(false);
  });
  it("accepts a valid combination with optional instructions", () => {
    expect(generationInputSchema.safeParse({ format: "9:16", style: "luxury", background: "premium", instructions: "soft light" }).success).toBe(true);
  });
});

describe("feedbackSchema", () => {
  it("requires all four fields", () => {
    expect(feedbackSchema.safeParse({ name: "Ana", email: "a@b.com", thoughts: "", nextIdeas: "x" }).success).toBe(false);
  });
});
```

```ts
// src/lib/validation/upload.test.ts
import { describe, it, expect } from "vitest";
import { assertValidImage, MAX_UPLOAD_BYTES } from "@/lib/validation/upload";

describe("assertValidImage", () => {
  it("accepts a small png", () => {
    expect(assertValidImage({ type: "image/png", size: 1000 })).toEqual({ ok: true });
  });
  it("rejects a pdf", () => {
    expect(assertValidImage({ type: "application/pdf", size: 1000 })).toEqual({ ok: false, reason: "type" });
  });
  it("rejects an oversized file", () => {
    expect(assertValidImage({ type: "image/jpeg", size: MAX_UPLOAD_BYTES + 1 })).toEqual({ ok: false, reason: "size" });
  });
});
```

- [ ] **Step 2: Run tests → FAIL.** Run: `pnpm --filter product-photos test -- validation`

- [ ] **Step 3: Implement `src/lib/validation/upload.ts`**

```ts
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_MB ?? 10) * 1024 * 1024;

export function assertValidImage(file: { type: string; size: number }):
  | { ok: true }
  | { ok: false; reason: "type" | "size" } {
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return { ok: false, reason: "type" };
  }
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, reason: "size" };
  return { ok: true };
}
```

- [ ] **Step 4: Implement `src/lib/validation/schemas.ts`**

```ts
import { z } from "zod";
import { isFormatId, isStyleId, isBackgroundId } from "@/lib/ai/options";

export const signupSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    email: z.string().trim().email(),
    password: z.string().min(8).max(200),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "passwords_do_not_match",
  });

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export const generationInputSchema = z.object({
  format: z.string().refine(isFormatId, "invalid_format"),
  style: z.string().refine(isStyleId, "invalid_style"),
  background: z.string().refine(isBackgroundId, "invalid_background"),
  instructions: z.string().trim().max(1000).optional(),
});

export const feedbackSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email(),
  thoughts: z.string().trim().min(1).max(2000),
  nextIdeas: z.string().trim().min(1).max(2000),
});

export type GenerationInput = z.infer<typeof generationInputSchema>;
export type FeedbackInput = z.infer<typeof feedbackSchema>;
```

- [ ] **Step 5: Run tests → PASS.** Run: `pnpm --filter product-photos test -- validation`

- [ ] **Step 6: Commit**

```bash
git add apps/product-photos/src/lib/validation
git commit -m "Add zod validation schemas and upload limits"
```

---

### Task 9: Storage abstraction (local volume)

**Files:**
- Create: `apps/product-photos/src/lib/storage/index.ts`, `apps/product-photos/src/lib/storage/local.ts`
- Test: `apps/product-photos/src/lib/storage/local.test.ts`

**Interfaces:**
- Produces from `@/lib/storage/index`:
  - `interface Storage { put(key: string, data: Buffer, contentType: string): Promise<{ url: string }>; read(key: string): Promise<{ data: Buffer; contentType: string }>; }`
  - `export const storage: Storage` — the `LocalStorage` singleton, rooted at `process.env.STORAGE_DIR ?? "./.data"`.
  - `mediaKey(generationId: string, kind: "original" | "generated", ext: string): string` → `"<generationId>/<kind>.<ext>"`.
- `put` returns `{ url }` where `url` is `/api/media/<generationId>/<kind>` (derived by the caller, not storage) — storage's own `url` is the relative key; callers build the API URL. **Clarify:** `put` returns `{ url: key }` (the key). The DB stores `/api/media/...` built by the route. Keep storage URL-agnostic.
- `LocalStorage` writes `${root}/${key}` (creating parent dirs) and a sidecar `${root}/${key}.meta` holding the content type.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/storage/local.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { LocalStorage } from "@/lib/storage/local";

let dir: string;
beforeEach(async () => { dir = await mkdtemp(join(tmpdir(), "pp-store-")); });
afterEach(async () => { await rm(dir, { recursive: true, force: true }); });

describe("LocalStorage", () => {
  it("round-trips a buffer with its content type", async () => {
    const s = new LocalStorage(dir);
    await s.put("gen1/original.png", Buffer.from("hello"), "image/png");
    const got = await s.read("gen1/original.png");
    expect(got.data.toString()).toBe("hello");
    expect(got.contentType).toBe("image/png");
  });
  it("creates nested directories", async () => {
    const s = new LocalStorage(dir);
    await expect(s.put("a/b/c/x.jpg", Buffer.from("x"), "image/jpeg")).resolves.toBeTruthy();
  });
  it("read throws for a missing key", async () => {
    const s = new LocalStorage(dir);
    await expect(s.read("missing/x.png")).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run test → FAIL.** Run: `pnpm --filter product-photos test -- storage`

- [ ] **Step 3: Implement `src/lib/storage/local.ts`**

```ts
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { Storage } from "@/lib/storage/index";

export class LocalStorage implements Storage {
  constructor(private root: string) {}

  private full(key: string) {
    return join(this.root, key);
  }

  async put(key: string, data: Buffer, contentType: string) {
    const path = this.full(key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, data);
    await writeFile(`${path}.meta`, contentType, "utf8");
    return { url: key };
  }

  async read(key: string) {
    const path = this.full(key);
    const data = await readFile(path);
    let contentType = "application/octet-stream";
    try {
      contentType = (await readFile(`${path}.meta`, "utf8")).trim() || contentType;
    } catch {
      /* no sidecar — fall back */
    }
    return { data, contentType };
  }
}
```

- [ ] **Step 4: Implement `src/lib/storage/index.ts`**

```ts
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
```

- [ ] **Step 5: Run test → PASS.** Run: `pnpm --filter product-photos test -- storage`

- [ ] **Step 6: Commit**

```bash
git add apps/product-photos/src/lib/storage
git commit -m "Add local Storage abstraction"
```

---

### Task 10: AI provider interface + Kie.ai implementation

**Files:**
- Create: `apps/product-photos/src/lib/ai/product-photo-provider.ts`, `apps/product-photos/src/lib/ai/kie-provider.ts`
- Test: `apps/product-photos/src/lib/ai/kie-provider.test.ts`

**Interfaces:**
- Produces from `@/lib/ai/product-photo-provider`:
  ```ts
  export type JobResult =
    | { status: "pending" }
    | { status: "completed"; imageUrl: string }
    | { status: "failed"; error: string };

  export interface CreateJobInput {
    image: Buffer;
    fileName: string;         // e.g. "gen1-original.png"
    contentType: string;
    prompt: string;
    aspectRatio: "1:1" | "4:5" | "9:16" | "16:9";
  }

  export interface ProductPhotoProvider {
    createJob(input: CreateJobInput): Promise<{ jobId: string }>;
    getJob(jobId: string): Promise<JobResult>;
  }

  export const provider: ProductPhotoProvider; // KieProvider singleton
  ```
- `KieProvider` uses `fetch`. Env read at construction: `KIE_API_KEY` (required — throw if missing when a method is called), `KIE_BASE_URL` (default `https://api.kie.ai`), `KIE_UPLOAD_URL` (default `https://kieai.redpandaai.co/api/file-stream-upload`), `KIE_MODEL` (default `nano-banana-2`), `KIE_RESOLUTION` (default `2K`).
- `createJob`: (1) upload `image` via multipart POST to `KIE_UPLOAD_URL` (`file`, `uploadPath="product-photos/uploads"`, `fileName`) → read `data.downloadUrl ?? data.fileUrl`; (2) POST `${KIE_BASE_URL}/api/v1/jobs/createTask` with `{ model, input: { prompt, image_input: [uploadedUrl], aspect_ratio, resolution, output_format: "png" } }` → return `{ jobId: data.taskId }`.
- `getJob`: GET `${KIE_BASE_URL}/api/v1/jobs/recordInfo?taskId=<jobId>` → map `data.state`: `waiting|queuing|generating` → `{ status: "pending" }`; `success` → parse `data.resultJson` (`JSON.parse`) → `{ status: "completed", imageUrl: resultUrls[0] }`; `fail` → `{ status: "failed", error: data.failMsg || "generation failed" }`.
- All Kie calls send `Authorization: Bearer ${KIE_API_KEY}`. Non-2xx → throw `Error` with status + body snippet.

- [ ] **Step 1: Write the failing test** (mock `global.fetch`)

```ts
// src/lib/ai/kie-provider.test.ts
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
```

- [ ] **Step 2: Run test → FAIL.** Run: `pnpm --filter product-photos test -- kie-provider`

- [ ] **Step 3: Implement `src/lib/ai/product-photo-provider.ts`**

```ts
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
```

- [ ] **Step 4: Implement `src/lib/ai/kie-provider.ts`**

```ts
import type { CreateJobInput, JobResult, ProductPhotoProvider } from "@/lib/ai/product-photo-provider";

const UPLOAD_PATH = "product-photos/uploads";

export class KieProvider implements ProductPhotoProvider {
  private get key() {
    const k = process.env.KIE_API_KEY;
    if (!k) throw new Error("KIE_API_KEY is not set");
    return k;
  }
  private get base() {
    return process.env.KIE_BASE_URL ?? "https://api.kie.ai";
  }
  private get uploadUrl() {
    return process.env.KIE_UPLOAD_URL ?? "https://kieai.redpandaai.co/api/file-stream-upload";
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
    return res.json() as Promise<{ code?: number; msg?: string; data?: Record<string, unknown> }>;
  }

  private async uploadImage(input: CreateJobInput): Promise<string> {
    const form = new FormData();
    form.append("file", new Blob([input.image], { type: input.contentType }), input.fileName);
    form.append("uploadPath", UPLOAD_PATH);
    form.append("fileName", input.fileName);
    const res = await fetch(this.uploadUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.key}` },
      body: form,
    });
    const body = await this.json(res, "upload");
    const url = (body.data?.downloadUrl ?? body.data?.fileUrl) as string | undefined;
    if (!url) throw new Error(`Kie upload returned no url: ${JSON.stringify(body).slice(0, 300)}`);
    return url;
  }

  async createJob(input: CreateJobInput): Promise<{ jobId: string }> {
    const imageUrl = await this.uploadImage(input);
    const res = await fetch(`${this.base}/api/v1/jobs/createTask`, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        input: {
          prompt: input.prompt,
          image_input: [imageUrl],
          aspect_ratio: input.aspectRatio,
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
      const parsed = raw ? (JSON.parse(raw) as { resultUrls?: string[] }) : {};
      const imageUrl = parsed.resultUrls?.[0];
      if (!imageUrl) return { status: "failed", error: "no result url" };
      return { status: "completed", imageUrl };
    }
    if (state === "fail") {
      return { status: "failed", error: (body.data?.failMsg as string) || "generation failed" };
    }
    return { status: "pending" };
  }
}
```

- [ ] **Step 5: Run test → PASS.** Run: `pnpm --filter product-photos test -- kie-provider`

- [ ] **Step 6: Commit**

```bash
git add apps/product-photos/src/lib/ai/product-photo-provider.ts apps/product-photos/src/lib/ai/kie-provider.ts apps/product-photos/src/lib/ai/kie-provider.test.ts
git commit -m "Add ProductPhotoProvider interface and Kie.ai implementation"
```

---

### Task 11: Feedback → FormSubmit proxy helper

**Files:**
- Create: `apps/product-photos/src/lib/feedback/formsubmit.ts`
- Test: `apps/product-photos/src/lib/feedback/formsubmit.test.ts`

**Interfaces:**
- Consumes: `FeedbackInput` from `@/lib/validation/schemas`.
- Produces: `submitFeedback(input: FeedbackInput): Promise<void>` — POSTs JSON to `https://formsubmit.co/ajax/${FORMSUBMIT_EMAIL}` with `{ _subject, name, email, message, next_ideas }`; throws if `FORMSUBMIT_EMAIL` is unset or the response is non-2xx or `{ success: "false" }`.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/feedback/formsubmit.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { submitFeedback } from "@/lib/feedback/formsubmit";

const OLD = { ...process.env };
beforeEach(() => { process.env.FORMSUBMIT_EMAIL = "owner@example.com"; });
afterEach(() => { process.env = { ...OLD }; vi.restoreAllMocks(); });

const payload = { name: "Ana", email: "a@b.com", thoughts: "great", nextIdeas: "shoes" };

describe("submitFeedback", () => {
  it("posts to the FormSubmit ajax endpoint for the configured email", async () => {
    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ success: "true" }), { status: 200 }),
    );
    await submitFeedback(payload);
    expect(String(fetchMock.mock.calls[0][0])).toBe("https://formsubmit.co/ajax/owner@example.com");
    const sent = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(sent.email).toBe("a@b.com");
    expect(sent.message).toBe("great");
  });
  it("throws when FORMSUBMIT_EMAIL is missing", async () => {
    delete process.env.FORMSUBMIT_EMAIL;
    await expect(submitFeedback(payload)).rejects.toThrow(/FORMSUBMIT_EMAIL/);
  });
  it("throws on a non-ok response", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(new Response("nope", { status: 500 }));
    await expect(submitFeedback(payload)).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run test → FAIL.** Run: `pnpm --filter product-photos test -- formsubmit`

- [ ] **Step 3: Implement `src/lib/feedback/formsubmit.ts`**

```ts
import type { FeedbackInput } from "@/lib/validation/schemas";

export async function submitFeedback(input: FeedbackInput): Promise<void> {
  const email = process.env.FORMSUBMIT_EMAIL;
  if (!email) throw new Error("FORMSUBMIT_EMAIL is not set");

  const res = await fetch(`https://formsubmit.co/ajax/${email}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      _subject: "Novalup AI — Product Photos feedback",
      name: input.name,
      email: input.email,
      message: input.thoughts,
      next_ideas: input.nextIdeas,
    }),
  });

  if (!res.ok) throw new Error(`FormSubmit failed: ${res.status}`);
  const body = (await res.json().catch(() => ({}))) as { success?: string | boolean };
  if (body.success === "false" || body.success === false) {
    throw new Error("FormSubmit rejected the submission");
  }
}
```

- [ ] **Step 4: Run test → PASS.** Run: `pnpm --filter product-photos test -- formsubmit`

- [ ] **Step 5: Commit**

```bash
git add apps/product-photos/src/lib/feedback
git commit -m "Add FormSubmit feedback proxy helper"
```

---

## Phase D — Authentication

### Task 12: Password hashing

**Files:**
- Create: `apps/product-photos/src/lib/auth/password.ts`
- Test: `apps/product-photos/src/lib/auth/password.test.ts`

**Interfaces:**
- Produces: `hashPassword(plain: string): Promise<string>`, `verifyPassword(plain: string, hash: string): Promise<boolean>` — `bcryptjs`, cost 10.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/auth/password.test.ts
import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

describe("password", () => {
  it("hashes and verifies a correct password", async () => {
    const h = await hashPassword("s3cret-pass");
    expect(h).not.toBe("s3cret-pass");
    expect(await verifyPassword("s3cret-pass", h)).toBe(true);
  });
  it("rejects a wrong password", async () => {
    const h = await hashPassword("s3cret-pass");
    expect(await verifyPassword("wrong", h)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test → FAIL.** Run: `pnpm --filter product-photos test -- password`

- [ ] **Step 3: Implement `src/lib/auth/password.ts`**

```ts
import bcrypt from "bcryptjs";

const COST = 10;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, COST);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
```

- [ ] **Step 4: Run test → PASS.** Run: `pnpm --filter product-photos test -- password`

- [ ] **Step 5: Commit**

```bash
git add apps/product-photos/src/lib/auth/password.ts apps/product-photos/src/lib/auth/password.test.ts
git commit -m "Add bcryptjs password hashing"
```

---

### Task 13: Auth.js configuration and route handlers

**Files:**
- Create: `apps/product-photos/src/lib/auth/auth.ts`, `apps/product-photos/src/lib/auth/session.ts`, `apps/product-photos/src/app/api/auth/[...nextauth]/route.ts`
- Reference: read the Auth.js v5 docs via context7 (`resolve-library-id` → `next-auth`, then `query-docs` for "Credentials provider Prisma adapter JWT session Next.js App Router") before writing — the beta API shifts between releases.

**Interfaces:**
- Consumes: `prisma` (`@/lib/db/client`), `verifyPassword` (`@/lib/auth/password`), `grantFreeCredits` (`@/lib/credits/service`), `loginSchema` (`@/lib/validation/schemas`).
- Produces from `@/lib/auth/auth`: `export const { handlers, auth, signIn, signOut }`.
- Produces from `@/lib/auth/session`: `requireUser(): Promise<{ id: string; email: string; name: string | null } | null>`.

- [ ] **Step 1: Implement `src/lib/auth/auth.ts`**

```ts
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db/client";
import { verifyPassword } from "@/lib/auth/password";
import { grantFreeCredits } from "@/lib/credits/service";
import { loginSchema } from "@/lib/validation/schemas";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: { signIn: "/login" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (raw) => {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;
        const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
        if (!user?.passwordHash) return null;
        const ok = await verifyPassword(parsed.data.password, user.passwordHash);
        if (!ok) return null;
        return { id: user.id, email: user.email, name: user.name, image: user.image };
      },
    }),
  ],
  callbacks: {
    jwt: ({ token, user }) => {
      if (user?.id) token.userId = user.id;
      return token;
    },
    session: ({ session, token }) => {
      if (token.userId) session.user.id = token.userId as string;
      return session;
    },
  },
  events: {
    createUser: async ({ user }) => {
      if (user.id) await grantFreeCredits(user.id);
    },
  },
});
```

> Note: `events.createUser` fires only for adapter-created users (Google). The email/password path seeds credits itself (Task 14).

- [ ] **Step 2: Implement `src/app/api/auth/[...nextauth]/route.ts`**

```ts
import { handlers } from "@/lib/auth/auth";

export const { GET, POST } = handlers;
```

- [ ] **Step 3: Implement `src/lib/auth/session.ts`**

```ts
import { auth } from "@/lib/auth/auth";

export async function requireUser(): Promise<
  { id: string; email: string; name: string | null } | null
> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return {
    id: session.user.id,
    email: session.user.email ?? "",
    name: session.user.name ?? null,
  };
}
```

- [ ] **Step 4: Typecheck**

Run: `pnpm --filter product-photos typecheck`
Expected: clean. (If `next-auth` beta types complain about `session.user.id`, confirm `src/types/next-auth.d.ts` from Task 4 is picked up by `tsconfig` `include`.)

- [ ] **Step 5: Manual smoke — Google sign-in**

Set real `GOOGLE_CLIENT_ID/SECRET` and `NEXTAUTH_SECRET` (`openssl rand -base64 32`) in `.env`. Temporarily add a throwaway `src/app/app/page.tsx` returning `<pre>` of `await auth()`. Run `pnpm --filter product-photos dev`, visit `/api/auth/signin`, sign in with Google, confirm a `User` row is created with `credits = 3` (`pnpm --filter product-photos prisma studio`). Remove the throwaway page.

- [ ] **Step 6: Commit**

```bash
git add apps/product-photos/src/lib/auth/auth.ts apps/product-photos/src/lib/auth/session.ts "apps/product-photos/src/app/api/auth/[...nextauth]/route.ts"
git commit -m "Configure Auth.js (Google + credentials, JWT, free-credit grant)"
```

---

### Task 14: Email/password signup route

**Files:**
- Create: `apps/product-photos/src/app/api/auth/signup/route.ts`
- Test: `apps/product-photos/src/app/api/auth/signup/route.test.ts`

**Interfaces:**
- Consumes: `signupSchema`, `prisma`, `hashPassword`, `FREE_CREDITS`.
- Produces: `POST /api/auth/signup` — body JSON `{ name, email, password, confirmPassword }`.
  - `201 { ok: true }` on success (creates `User` with `passwordHash` and `credits: FREE_CREDITS`).
  - `422 { error: "validation", issues }` on schema failure.
  - `409 { error: "email_taken" }` if the email already exists.
  - The route only creates the user; the client then calls `signIn("credentials", …)`.

- [ ] **Step 1: Write the failing test** (mock prisma + password)

```ts
// src/app/api/auth/signup/route.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const findUnique = vi.fn();
const create = vi.fn();
vi.mock("@/lib/db/client", () => ({ prisma: { user: { findUnique, create } } }));
vi.mock("@/lib/auth/password", () => ({ hashPassword: vi.fn().mockResolvedValue("HASH") }));

import { POST } from "@/app/api/auth/signup/route";
import { FREE_CREDITS } from "@/lib/credits/config";

function req(body: unknown) {
  return new Request("http://localhost/api/auth/signup", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => { findUnique.mockReset(); create.mockReset(); });

const valid = { name: "Ana", email: "a@b.com", password: "12345678", confirmPassword: "12345678" };

describe("POST /api/auth/signup", () => {
  it("creates a user with hashed password and free credits", async () => {
    findUnique.mockResolvedValue(null);
    create.mockResolvedValue({ id: "u1" });
    const res = await POST(req(valid));
    expect(res.status).toBe(201);
    expect(create).toHaveBeenCalledWith({
      data: { name: "Ana", email: "a@b.com", passwordHash: "HASH", credits: FREE_CREDITS },
    });
  });
  it("rejects a duplicate email with 409", async () => {
    findUnique.mockResolvedValue({ id: "existing" });
    const res = await POST(req(valid));
    expect(res.status).toBe(409);
  });
  it("rejects mismatched passwords with 422", async () => {
    const res = await POST(req({ ...valid, confirmPassword: "99999999" }));
    expect(res.status).toBe(422);
  });
});
```

- [ ] **Step 2: Run test → FAIL.** Run: `pnpm --filter product-photos test -- signup`

- [ ] **Step 3: Implement `src/app/api/auth/signup/route.ts`**

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { hashPassword } from "@/lib/auth/password";
import { signupSchema } from "@/lib/validation/schemas";
import { FREE_CREDITS } from "@/lib/credits/config";

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = signupSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation", issues: parsed.error.flatten() }, { status: 422 });
  }

  const { name, email, password } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "email_taken" }, { status: 409 });

  const passwordHash = await hashPassword(password);
  await prisma.user.create({ data: { name, email, passwordHash, credits: FREE_CREDITS } });

  return NextResponse.json({ ok: true }, { status: 201 });
}
```

- [ ] **Step 4: Run test → PASS.** Run: `pnpm --filter product-photos test -- signup`

- [ ] **Step 5: Commit**

```bash
git add apps/product-photos/src/app/api/auth/signup
git commit -m "Add email/password signup route"
```

---

### Task 15: Route protection middleware

**Files:**
- Create: `apps/product-photos/src/middleware.ts`

**Interfaces:**
- Produces: Next middleware that runs for `/`, `/login`, `/signup`, `/app/:path*`.
  - No session cookie + path under `/app` → redirect `/login`.
  - Session cookie present + path is `/`, `/login`, or `/signup` → redirect `/app`.
- "Session cookie present" = any of `authjs.session-token`, `__Secure-authjs.session-token`, `next-auth.session-token`, `__Secure-next-auth.session-token` exists. This is a UX redirect only — real enforcement is `auth()` in `src/app/app/layout.tsx` (Task 19) and `requireUser()` in the API routes.

- [ ] **Step 1: Implement `src/middleware.ts`**

```ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
];

export function middleware(req: NextRequest) {
  const hasSession = SESSION_COOKIES.some((c) => req.cookies.has(c));
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/app") && !hasSession) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (hasSession && ["/", "/login", "/signup"].includes(pathname)) {
    return NextResponse.redirect(new URL("/app", req.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/", "/login", "/signup", "/app/:path*"] };
```

- [ ] **Step 2: Manual smoke**

`pnpm --filter product-photos dev`. Logged out: `/app` → redirects to `/login`. After a Google sign-in: visiting `/login` → redirects to `/app`.

- [ ] **Step 3: Commit**

```bash
git add apps/product-photos/src/middleware.ts
git commit -m "Add route-protection middleware"
```

---

## Phase E — API routes

### Task 16: Media serving route (ownership-checked)

**Files:**
- Modify: `apps/product-photos/src/lib/storage/index.ts` — add `readMedia`
- Create: `apps/product-photos/src/app/api/media/[id]/[kind]/route.ts`
- Test: `apps/product-photos/src/app/api/media/[id]/[kind]/route.test.ts`

**Interfaces:**
- Adds to `@/lib/storage/index`: `readMedia(generationId: string, kind: "original" | "generated"): Promise<{ data: Buffer; contentType: string } | null>` — for `original` tries extensions `["jpg","jpeg","png","webp"]`; for `generated` tries `["png"]`; returns `null` if none exist.
- Produces: `GET /api/media/:id/:kind` (`kind` ∈ `original|generated`). `requireUser` → 401. `generation.userId !== user.id` or missing → **404**. Unknown `kind` → 404. File missing → 404. Else stream bytes with `Content-Type`; `?download=1` adds `Content-Disposition: attachment; filename="<id>-<kind>.<ext>"`. `Cache-Control: private, max-age=3600`.

- [ ] **Step 1: Write the failing test**

```ts
// src/app/api/media/[id]/[kind]/route.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const findUnique = vi.fn();
vi.mock("@/lib/db/client", () => ({ prisma: { generation: { findUnique } } }));
vi.mock("@/lib/auth/session", () => ({ requireUser: vi.fn() }));
vi.mock("@/lib/storage/index", async (orig) => {
  const actual = await orig<typeof import("@/lib/storage/index")>();
  return { ...actual, readMedia: vi.fn() };
});

import { GET } from "@/app/api/media/[id]/[kind]/route";
import { requireUser } from "@/lib/auth/session";
import { readMedia } from "@/lib/storage/index";

const ctx = (id: string, kind: string) => ({ params: Promise.resolve({ id, kind }) });
beforeEach(() => { vi.mocked(requireUser).mockResolvedValue({ id: "u1", email: "a@b.com", name: null }); findUnique.mockReset(); });

describe("GET /api/media/:id/:kind", () => {
  it("404s when the generation belongs to another user", async () => {
    findUnique.mockResolvedValue({ id: "g1", userId: "someone-else" });
    const res = await GET(new Request("http://x/api/media/g1/original"), ctx("g1", "original"));
    expect(res.status).toBe(404);
  });
  it("streams bytes for the owner", async () => {
    findUnique.mockResolvedValue({ id: "g1", userId: "u1" });
    vi.mocked(readMedia).mockResolvedValue({ data: Buffer.from("PNGDATA"), contentType: "image/png" });
    const res = await GET(new Request("http://x/api/media/g1/generated"), ctx("g1", "generated"));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/png");
    expect(Buffer.from(await res.arrayBuffer()).toString()).toBe("PNGDATA");
  });
  it("adds a download disposition when ?download=1", async () => {
    findUnique.mockResolvedValue({ id: "g1", userId: "u1" });
    vi.mocked(readMedia).mockResolvedValue({ data: Buffer.from("x"), contentType: "image/png" });
    const res = await GET(new Request("http://x/api/media/g1/generated?download=1"), ctx("g1", "generated"));
    expect(res.headers.get("content-disposition")).toContain("attachment");
  });
});
```

- [ ] **Step 2: Run test → FAIL.** Run: `pnpm --filter product-photos test -- media`

- [ ] **Step 3: Add `readMedia` to `src/lib/storage/index.ts`**

```ts
const EXT_BY_KIND: Record<"original" | "generated", string[]> = {
  original: ["jpg", "jpeg", "png", "webp"],
  generated: ["png"],
};

export async function readMedia(
  generationId: string,
  kind: "original" | "generated",
): Promise<{ data: Buffer; contentType: string } | null> {
  for (const ext of EXT_BY_KIND[kind]) {
    try {
      return await storage.read(mediaKey(generationId, kind, ext));
    } catch {
      /* try next extension */
    }
  }
  return null;
}
```

- [ ] **Step 4: Implement `src/app/api/media/[id]/[kind]/route.ts`**

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { requireUser } from "@/lib/auth/session";
import { readMedia } from "@/lib/storage/index";

const KINDS = new Set(["original", "generated"]);

export async function GET(
  request: Request,
  ctx: { params: Promise<{ id: string; kind: string }> },
) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id, kind } = await ctx.params;
  if (!KINDS.has(kind)) return new NextResponse(null, { status: 404 });

  const generation = await prisma.generation.findUnique({
    where: { id },
    select: { userId: true },
  });
  if (!generation || generation.userId !== user.id) {
    return new NextResponse(null, { status: 404 });
  }

  const file = await readMedia(id, kind as "original" | "generated");
  if (!file) return new NextResponse(null, { status: 404 });

  const headers = new Headers({
    "Content-Type": file.contentType,
    "Cache-Control": "private, max-age=3600",
  });
  if (new URL(request.url).searchParams.get("download") === "1") {
    const ext = file.contentType.split("/")[1] ?? "png";
    headers.set("Content-Disposition", `attachment; filename="${id}-${kind}.${ext}"`);
  }
  return new NextResponse(file.data as unknown as BodyInit, { status: 200, headers });
}
```

- [ ] **Step 5: Run test → PASS.** Run: `pnpm --filter product-photos test -- media`

- [ ] **Step 6: Commit**

```bash
git add apps/product-photos/src/lib/storage/index.ts "apps/product-photos/src/app/api/media"
git commit -m "Add ownership-checked media serving route"
```

---

### Task 17: Create-generation route (`POST /api/generations`)

**Files:**
- Create: `apps/product-photos/src/lib/generations/create.ts` (the testable core), `apps/product-photos/src/app/api/generations/route.ts` (thin HTTP wrapper)
- Test: `apps/product-photos/src/lib/generations/create.test.ts`

**Interfaces:**
- Consumes: `requireUser`, `generationInputSchema`, `assertValidImage`, `getCredits`, `buildPrompt`, `formatToAspectRatio`, `prisma`, `storage`/`mediaKey`/`mediaApiUrl`, `provider`.
- Produces: `createGeneration(args: { userId: string; image: Buffer; contentType: string; input: GenerationInput }): Promise<{ ok: true; id: string } | { ok: false; code: "NO_CREDITS" | "GENERATION_IN_PROGRESS" | "PROVIDER_ERROR"; }>`.
- Produces: `POST /api/generations` — `multipart/form-data` (`image`, `format`, `style`, `background`, `instructions?`). Status mapping: unauthorized → 401; bad options → 422 `{ error: "validation" }`; bad image → 422 `{ error: "invalid_image", reason }`; in progress → 409 `{ code: "GENERATION_IN_PROGRESS" }`; no credits → 403 `{ code: "NO_CREDITS" }`; provider failure → 502 `{ code: "PROVIDER_ERROR" }`; success → 201 `{ id }`.
- `contentTypeToExt(ct)`: `image/jpeg`→`jpg`, `image/png`→`png`, `image/webp`→`webp`. Add to `@/lib/validation/upload`.

- [ ] **Step 1: Add `contentTypeToExt` to `src/lib/validation/upload.ts`**

```ts
export function contentTypeToExt(contentType: string): "jpg" | "png" | "webp" {
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  return "jpg";
}
```

- [ ] **Step 2: Write the failing test**

```ts
// src/lib/generations/create.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const generation = { create: vi.fn(), update: vi.fn(), findFirst: vi.fn() };
vi.mock("@/lib/db/client", () => ({ prisma: { generation } }));
vi.mock("@/lib/credits/service", () => ({ getCredits: vi.fn() }));
vi.mock("@/lib/storage/index", () => ({
  storage: { put: vi.fn().mockResolvedValue({ url: "k" }) },
  mediaKey: (id: string, k: string, e: string) => `${id}/${k}.${e}`,
  mediaApiUrl: (id: string, k: string) => `/api/media/${id}/${k}`,
}));
vi.mock("@/lib/ai/product-photo-provider", () => ({ provider: { createJob: vi.fn() } }));

import { createGeneration } from "@/lib/generations/create";
import { getCredits } from "@/lib/credits/service";
import { provider } from "@/lib/ai/product-photo-provider";

const baseArgs = {
  userId: "u1",
  image: Buffer.from("img"),
  contentType: "image/png",
  input: { format: "1:1", style: "studio", background: "clean" } as const,
};

beforeEach(() => {
  Object.values(generation).forEach((f) => f.mockReset());
  generation.findFirst.mockResolvedValue(null);
  generation.create.mockResolvedValue({ id: "g1" });
  generation.update.mockResolvedValue({});
  vi.mocked(getCredits).mockResolvedValue(3);
  vi.mocked(provider.createJob).mockResolvedValue({ jobId: "task_1" });
});

describe("createGeneration", () => {
  it("blocks when a pending generation exists", async () => {
    generation.findFirst.mockResolvedValue({ id: "old" });
    expect(await createGeneration(baseArgs)).toEqual({ ok: false, code: "GENERATION_IN_PROGRESS" });
  });
  it("blocks when the user has 0 credits", async () => {
    vi.mocked(getCredits).mockResolvedValue(0);
    expect(await createGeneration(baseArgs)).toEqual({ ok: false, code: "NO_CREDITS" });
    expect(generation.create).not.toHaveBeenCalled();
  });
  it("creates the row, stores the original, starts the job, saves jobId", async () => {
    const res = await createGeneration(baseArgs);
    expect(res).toEqual({ ok: true, id: "g1" });
    expect(generation.update).toHaveBeenCalledWith({ where: { id: "g1" }, data: { providerJobId: "task_1" } });
    expect(provider.createJob).toHaveBeenCalledWith(
      expect.objectContaining({ aspectRatio: "1:1", prompt: expect.stringMatching(/photorealistic/i) }),
    );
  });
  it("marks the row failed and returns PROVIDER_ERROR when the provider throws", async () => {
    vi.mocked(provider.createJob).mockRejectedValue(new Error("kie down"));
    expect(await createGeneration(baseArgs)).toEqual({ ok: false, code: "PROVIDER_ERROR" });
    expect(generation.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "g1" }, data: expect.objectContaining({ status: "failed" }) }),
    );
  });
});
```

- [ ] **Step 3: Run test → FAIL.** Run: `pnpm --filter product-photos test -- create`

- [ ] **Step 4: Implement `src/lib/generations/create.ts`**

```ts
import { prisma } from "@/lib/db/client";
import { getCredits } from "@/lib/credits/service";
import { buildPrompt } from "@/lib/ai/prompt";
import { formatToAspectRatio } from "@/lib/ai/options";
import { provider } from "@/lib/ai/product-photo-provider";
import { storage, mediaKey, mediaApiUrl } from "@/lib/storage/index";
import { contentTypeToExt } from "@/lib/validation/upload";
import type { GenerationInput } from "@/lib/validation/schemas";

const STALE_MS = 5 * 60 * 1000;

type Result =
  | { ok: true; id: string }
  | { ok: false; code: "NO_CREDITS" | "GENERATION_IN_PROGRESS" | "PROVIDER_ERROR" };

export async function createGeneration(args: {
  userId: string;
  image: Buffer;
  contentType: string;
  input: GenerationInput;
}): Promise<Result> {
  const { userId, image, contentType, input } = args;

  const inProgress = await prisma.generation.findFirst({
    where: { userId, status: "pending", createdAt: { gt: new Date(Date.now() - STALE_MS) } },
    select: { id: true },
  });
  if (inProgress) return { ok: false, code: "GENERATION_IN_PROGRESS" };

  if ((await getCredits(userId)) <= 0) return { ok: false, code: "NO_CREDITS" };

  const aspectRatio = formatToAspectRatio(input.format);
  if (!aspectRatio) return { ok: false, code: "PROVIDER_ERROR" }; // guarded earlier by zod

  const prompt = buildPrompt({
    style: input.style,
    background: input.background,
    instructions: input.instructions,
  });

  const generation = await prisma.generation.create({
    data: {
      userId,
      originalImageUrl: "",
      format: input.format,
      style: input.style,
      background: input.background,
      instructions: input.instructions ?? null,
      prompt,
      status: "pending",
    },
  });

  const ext = contentTypeToExt(contentType);
  await storage.put(mediaKey(generation.id, "original", ext), image, contentType);
  await prisma.generation.update({
    where: { id: generation.id },
    data: { originalImageUrl: mediaApiUrl(generation.id, "original") },
  });

  try {
    const { jobId } = await provider.createJob({
      image,
      fileName: `${generation.id}-original.${ext}`,
      contentType,
      prompt,
      aspectRatio,
    });
    await prisma.generation.update({ where: { id: generation.id }, data: { providerJobId: jobId } });
    return { ok: true, id: generation.id };
  } catch (err) {
    await prisma.generation.update({
      where: { id: generation.id },
      data: { status: "failed", error: err instanceof Error ? err.message : "provider error" },
    });
    return { ok: false, code: "PROVIDER_ERROR" };
  }
}
```

- [ ] **Step 5: Run test → PASS.** Run: `pnpm --filter product-photos test -- create`

- [ ] **Step 6: Implement `src/app/api/generations/route.ts`**

```ts
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { generationInputSchema } from "@/lib/validation/schemas";
import { assertValidImage } from "@/lib/validation/upload";
import { createGeneration } from "@/lib/generations/create";

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const form = await request.formData();
  const file = form.get("image");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "invalid_image", reason: "missing" }, { status: 422 });
  }

  const check = assertValidImage({ type: file.type, size: file.size });
  if (!check.ok) {
    return NextResponse.json({ error: "invalid_image", reason: check.reason }, { status: 422 });
  }

  const parsed = generationInputSchema.safeParse({
    format: form.get("format"),
    style: form.get("style"),
    background: form.get("background"),
    instructions: form.get("instructions") || undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "validation", issues: parsed.error.flatten() }, { status: 422 });
  }

  const image = Buffer.from(await file.arrayBuffer());
  const result = await createGeneration({
    userId: user.id,
    image,
    contentType: file.type,
    input: parsed.data,
  });

  if (result.ok) return NextResponse.json({ id: result.id }, { status: 201 });
  const status = result.code === "NO_CREDITS" ? 403 : result.code === "GENERATION_IN_PROGRESS" ? 409 : 502;
  return NextResponse.json({ code: result.code }, { status });
}
```

- [ ] **Step 7: Typecheck + full test run.** Run: `pnpm --filter product-photos typecheck && pnpm --filter product-photos test`

- [ ] **Step 8: Commit**

```bash
git add apps/product-photos/src/lib/generations/create.ts apps/product-photos/src/lib/generations/create.test.ts apps/product-photos/src/lib/validation/upload.ts apps/product-photos/src/app/api/generations/route.ts
git commit -m "Add POST /api/generations (credit gate, upload, start Kie job)"
```

---

### Task 18: Poll-generation route (`GET /api/generations/[id]`)

**Files:**
- Create: `apps/product-photos/src/lib/generations/poll.ts`, `apps/product-photos/src/app/api/generations/[id]/route.ts`
- Test: `apps/product-photos/src/lib/generations/poll.test.ts`

**Interfaces:**
- Consumes: `prisma`, `provider.getJob`, `storage.put` / `mediaKey` / `mediaApiUrl`, `consumeOneCredit`, `getCredits`.
- Produces: `pollGeneration(args: { userId: string; id: string }): Promise<PollResult>` where
  ```ts
  type PollResult =
    | { code: "NOT_FOUND" }
    | { status: "pending" }
    | { status: "completed"; generatedImageUrl: string; creditsRemaining: number }
    | { status: "failed"; error: string };
  ```
- On a `pending` row with a `providerJobId`, calls `provider.getJob`:
  - provider `pending` → `{ status: "pending" }`
  - provider `failed` → set row `failed` + `error`; **no credit change**; return `{ status: "failed", error }`
  - provider `completed` → `fetch` the image bytes, `storage.put(mediaKey(id,"generated","png"), buf, "image/png")`, then a `prisma.$transaction`: re-read the row; if still `pending`, update to `completed` + `generatedImageUrl` and call `consumeOneCredit(tx, userId)`. Return `{ status: "completed", generatedImageUrl, creditsRemaining: getCredits() }`.
- Produces: `GET /api/generations/:id` — `requireUser` → 401; `{ code: "NOT_FOUND" }` → 404; otherwise 200 with the poll body.
- Idempotency: a second poll after completion returns the stored result and does **not** decrement again (guarded by the `status === "pending"` re-check inside the transaction).

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/generations/poll.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const generation = { findUnique: vi.fn(), update: vi.fn() };
const txGeneration = { findUnique: vi.fn(), update: vi.fn() };
const txUser = { updateMany: vi.fn() };
const $transaction = vi.fn(async (fn: (tx: unknown) => unknown) =>
  fn({ generation: txGeneration, user: txUser }),
);
vi.mock("@/lib/db/client", () => ({ prisma: { generation, $transaction } }));
vi.mock("@/lib/ai/product-photo-provider", () => ({ provider: { getJob: vi.fn() } }));
vi.mock("@/lib/credits/service", () => ({
  getCredits: vi.fn().mockResolvedValue(2),
  consumeOneCredit: vi.fn().mockResolvedValue(true),
}));
vi.mock("@/lib/storage/index", () => ({
  storage: { put: vi.fn().mockResolvedValue({ url: "k" }) },
  mediaKey: (id: string, k: string, e: string) => `${id}/${k}.${e}`,
  mediaApiUrl: (id: string, k: string) => `/api/media/${id}/${k}`,
}));

import { pollGeneration } from "@/lib/generations/poll";
import { provider } from "@/lib/ai/product-photo-provider";
import { consumeOneCredit } from "@/lib/credits/service";

beforeEach(() => {
  [generation.findUnique, generation.update, txGeneration.findUnique, txGeneration.update, txUser.updateMany].forEach((f) => f.mockReset());
  vi.mocked(consumeOneCredit).mockClear();
  vi.spyOn(global, "fetch").mockResolvedValue(new Response(Buffer.from("PNG"), { status: 200 }));
});

describe("pollGeneration", () => {
  it("returns NOT_FOUND for another user's row", async () => {
    generation.findUnique.mockResolvedValue({ id: "g1", userId: "other" });
    expect(await pollGeneration({ userId: "u1", id: "g1" })).toEqual({ code: "NOT_FOUND" });
  });

  it("passes through provider pending", async () => {
    generation.findUnique.mockResolvedValue({ id: "g1", userId: "u1", status: "pending", providerJobId: "t1" });
    vi.mocked(provider.getJob).mockResolvedValue({ status: "pending" });
    expect(await pollGeneration({ userId: "u1", id: "g1" })).toEqual({ status: "pending" });
  });

  it("on provider failure marks failed and does not consume a credit", async () => {
    generation.findUnique.mockResolvedValue({ id: "g1", userId: "u1", status: "pending", providerJobId: "t1" });
    vi.mocked(provider.getJob).mockResolvedValue({ status: "failed", error: "blocked" });
    const res = await pollGeneration({ userId: "u1", id: "g1" });
    expect(res).toEqual({ status: "failed", error: "blocked" });
    expect(consumeOneCredit).not.toHaveBeenCalled();
    expect(generation.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "failed", error: "blocked" }) }),
    );
  });

  it("on provider completion stores the image, transitions once, consumes one credit", async () => {
    generation.findUnique.mockResolvedValue({ id: "g1", userId: "u1", status: "pending", providerJobId: "t1" });
    vi.mocked(provider.getJob).mockResolvedValue({ status: "completed", imageUrl: "https://cdn/out.png" });
    txGeneration.findUnique.mockResolvedValue({ id: "g1", status: "pending" });
    const res = await pollGeneration({ userId: "u1", id: "g1" });
    expect(res).toEqual({ status: "completed", generatedImageUrl: "/api/media/g1/generated", creditsRemaining: 2 });
    expect(consumeOneCredit).toHaveBeenCalledTimes(1);
  });

  it("a second poll of a completed row returns the stored result without consuming again", async () => {
    generation.findUnique.mockResolvedValue({
      id: "g1", userId: "u1", status: "completed", generatedImageUrl: "/api/media/g1/generated",
    });
    const res = await pollGeneration({ userId: "u1", id: "g1" });
    expect(res).toEqual({ status: "completed", generatedImageUrl: "/api/media/g1/generated", creditsRemaining: 2 });
    expect(consumeOneCredit).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test → FAIL.** Run: `pnpm --filter product-photos test -- poll`

- [ ] **Step 3: Implement `src/lib/generations/poll.ts`**

```ts
import { prisma } from "@/lib/db/client";
import { provider } from "@/lib/ai/product-photo-provider";
import { consumeOneCredit, getCredits } from "@/lib/credits/service";
import { storage, mediaKey, mediaApiUrl } from "@/lib/storage/index";

export type PollResult =
  | { code: "NOT_FOUND" }
  | { status: "pending" }
  | { status: "completed"; generatedImageUrl: string; creditsRemaining: number }
  | { status: "failed"; error: string };

export async function pollGeneration(args: { userId: string; id: string }): Promise<PollResult> {
  const { userId, id } = args;
  const row = await prisma.generation.findUnique({ where: { id } });
  if (!row || row.userId !== userId) return { code: "NOT_FOUND" };

  if (row.status === "completed") {
    return {
      status: "completed",
      generatedImageUrl: row.generatedImageUrl ?? mediaApiUrl(id, "generated"),
      creditsRemaining: await getCredits(userId),
    };
  }
  if (row.status === "failed") {
    return { status: "failed", error: row.error ?? "generation failed" };
  }
  if (!row.providerJobId) return { status: "pending" };

  const job = await provider.getJob(row.providerJobId);

  if (job.status === "pending") return { status: "pending" };

  if (job.status === "failed") {
    await prisma.generation.update({
      where: { id },
      data: { status: "failed", error: job.error },
    });
    return { status: "failed", error: job.error };
  }

  // completed — download and persist the image before touching credits
  const res = await fetch(job.imageUrl);
  if (!res.ok) return { status: "pending" }; // transient; try again next poll
  const buf = Buffer.from(await res.arrayBuffer());
  await storage.put(mediaKey(id, "generated", "png"), buf, "image/png");

  const generatedImageUrl = mediaApiUrl(id, "generated");
  await prisma.$transaction(async (tx) => {
    const fresh = await tx.generation.findUnique({ where: { id }, select: { status: true } });
    if (fresh?.status !== "pending") return;
    await tx.generation.update({ where: { id }, data: { status: "completed", generatedImageUrl } });
    await consumeOneCredit(tx, userId);
  });

  return { status: "completed", generatedImageUrl, creditsRemaining: await getCredits(userId) };
}
```

- [ ] **Step 4: Implement `src/app/api/generations/[id]/route.ts`**

```ts
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { pollGeneration } from "@/lib/generations/poll";

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const result = await pollGeneration({ userId: user.id, id });
  if ("code" in result && result.code === "NOT_FOUND") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json(result);
}
```

- [ ] **Step 5: Run test → PASS + typecheck.** Run: `pnpm --filter product-photos test -- poll && pnpm --filter product-photos typecheck`

- [ ] **Step 6: Commit**

```bash
git add apps/product-photos/src/lib/generations/poll.ts apps/product-photos/src/lib/generations/poll.test.ts "apps/product-photos/src/app/api/generations/[id]"
git commit -m "Add GET /api/generations/:id polling with one-time credit consume"
```

---

### Task 19: Feedback route (`POST /api/feedback`)

**Files:**
- Create: `apps/product-photos/src/app/api/feedback/route.ts`
- Test: `apps/product-photos/src/app/api/feedback/route.test.ts`

**Interfaces:**
- Consumes: `requireUser`, `feedbackSchema`, `submitFeedback`.
- Produces: `POST /api/feedback` — JSON body `{ name, email, thoughts, nextIdeas }`. `requireUser` → 401; schema failure → 422; `submitFeedback` throws → 502 `{ error: "send_failed" }`; success → 200 `{ ok: true }`.

- [ ] **Step 1: Write the failing test**

```ts
// src/app/api/feedback/route.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth/session", () => ({ requireUser: vi.fn() }));
vi.mock("@/lib/feedback/formsubmit", () => ({ submitFeedback: vi.fn() }));

import { POST } from "@/app/api/feedback/route";
import { requireUser } from "@/lib/auth/session";
import { submitFeedback } from "@/lib/feedback/formsubmit";

const body = { name: "Ana", email: "a@b.com", thoughts: "cool", nextIdeas: "sneakers" };
const req = (b: unknown) =>
  new Request("http://x/api/feedback", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(b) });

beforeEach(() => {
  vi.mocked(requireUser).mockResolvedValue({ id: "u1", email: "a@b.com", name: "Ana" });
  vi.mocked(submitFeedback).mockReset().mockResolvedValue(undefined);
});

describe("POST /api/feedback", () => {
  it("401 without a session", async () => {
    vi.mocked(requireUser).mockResolvedValue(null);
    expect((await POST(req(body))).status).toBe(401);
  });
  it("forwards a valid payload to submitFeedback", async () => {
    const res = await POST(req(body));
    expect(res.status).toBe(200);
    expect(submitFeedback).toHaveBeenCalledWith(body);
  });
  it("422 on an invalid payload", async () => {
    expect((await POST(req({ ...body, email: "nope" }))).status).toBe(422);
  });
  it("502 when the send fails", async () => {
    vi.mocked(submitFeedback).mockRejectedValue(new Error("down"));
    expect((await POST(req(body))).status).toBe(502);
  });
});
```

- [ ] **Step 2: Run test → FAIL.** Run: `pnpm --filter product-photos test -- feedback/route`

- [ ] **Step 3: Implement `src/app/api/feedback/route.ts`**

```ts
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { feedbackSchema } from "@/lib/validation/schemas";
import { submitFeedback } from "@/lib/feedback/formsubmit";

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = feedbackSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "validation", issues: parsed.error.flatten() }, { status: 422 });
  }

  try {
    await submitFeedback(parsed.data);
  } catch {
    return NextResponse.json({ error: "send_failed" }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Run test → PASS.** Run: `pnpm --filter product-photos test -- feedback/route`

- [ ] **Step 5: Commit**

```bash
git add apps/product-photos/src/app/api/feedback
git commit -m "Add POST /api/feedback (FormSubmit proxy)"
```

---

## Phase F — UI

> **Design:** these tasks build functionally-correct components with brand-consistent Tailwind (`night`/`accent`, Inter, `rounded-2xl` cards, pill buttons, ≥44px touch targets, discreet 150–200ms transitions, `prefers-reduced-motion` respected). When executing this phase, use the `frontend-design` skill for the visual pass — premium, minimal, generous whitespace, strong responsive behavior, no corporate-dashboard feel. The flow must read as **Upload → Choose style → Generate → Download**. All copy comes from `@/content/copy` — no inline Spanish strings in components.

### Task 20: UI primitives

**Files:**
- Create: `apps/product-photos/src/components/ui/Button.tsx`, `Card.tsx`, `Field.tsx`, `SegmentedControl.tsx`, `Spinner.tsx`
- Create: `apps/product-photos/src/lib/cn.ts`

**Interfaces:**
- `cn(...classes: Array<string | false | null | undefined>): string` — join truthy classes.
- `Button` — props: `variant?: "primary" | "outline" | "ghost"` (default `primary`), `size?: "md" | "lg"`, plus native `<button>` props; renders `<a>` when given `href`. Primary = accent gradient, white text, pill, hover lift.
- `Card` — `<div>` wrapper: `rounded-2xl border border-white/[0.08] bg-night-card/60 p-6`.
- `Field` — props: `label: string`, `error?: string`, `children` (the input). Renders label + child + error text. Passes an `id` down via context or `htmlFor` by cloning — simplest: caller supplies `htmlFor` + input `id`.
- `SegmentedControl<T extends string>` — props: `options: ReadonlyArray<{ value: T; label: string }>`, `value: T | null`, `onChange: (v: T) => void`, `ariaLabel: string`. Wrapping flex row of pill buttons; selected = accent border/bg.
- `Spinner` — props: `label?: string`. Accessible (`role="status"`).

- [ ] **Step 1: Implement `src/lib/cn.ts`**

```ts
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
```

- [ ] **Step 2: Implement the five primitives**

```tsx
// src/components/ui/Button.tsx
import Link from "next/link";
import { cn } from "@/lib/cn";

type Common = { variant?: "primary" | "outline" | "ghost"; size?: "md" | "lg"; className?: string };

const styles = {
  base: "inline-flex items-center justify-center rounded-full font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-light disabled:opacity-50 disabled:pointer-events-none",
  size: { md: "px-5 py-2.5 text-sm min-h-[44px]", lg: "px-7 py-3.5 text-base min-h-[52px]" },
  variant: {
    primary: "bg-gradient-to-r from-accent to-accent-dark text-white shadow-lg shadow-accent/20 hover:-translate-y-0.5 hover:shadow-accent/30",
    outline: "border border-white/20 text-white hover:bg-white/[0.06]",
    ghost: "text-neutral-300 hover:text-white hover:bg-white/[0.06]",
  },
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  href,
  ...props
}: Common & (React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: string })) {
  const cls = cn(styles.base, styles.size[size], styles.variant[variant], className);
  if (href) return <Link href={href} className={cls}>{props.children}</Link>;
  return <button className={cls} {...props} />;
}
```

```tsx
// src/components/ui/Card.tsx
import { cn } from "@/lib/cn";
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-2xl border border-white/[0.08] bg-night-card/60 p-6", className)} {...props} />;
}
```

```tsx
// src/components/ui/Field.tsx
export function Field({
  label, htmlFor, error, children,
}: { label: string; htmlFor: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-neutral-300">{label}</label>
      {children}
      {error ? <p className="text-sm text-accent-light">{error}</p> : null}
    </div>
  );
}

export const inputClass =
  "w-full rounded-xl border border-white/10 bg-night-soft px-4 py-3 text-white placeholder:text-neutral-500 focus:border-accent-light focus:outline-none min-h-[44px]";
```

```tsx
// src/components/ui/SegmentedControl.tsx
"use client";
import { cn } from "@/lib/cn";

export function SegmentedControl<T extends string>({
  options, value, onChange, ariaLabel,
}: {
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T | null;
  onChange: (v: T) => void;
  ariaLabel: string;
}) {
  return (
    <div role="group" aria-label={ariaLabel} className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-full border px-4 py-2 text-sm transition-colors min-h-[44px]",
            value === o.value
              ? "border-accent bg-accent/15 text-white"
              : "border-white/12 text-neutral-300 hover:border-white/25 hover:text-white",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
```

```tsx
// src/components/ui/Spinner.tsx
export function Spinner({ label }: { label?: string }) {
  return (
    <div role="status" className="flex items-center gap-3 text-neutral-300">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-accent-light motion-reduce:animate-none" />
      {label ? <span className="text-sm">{label}</span> : <span className="sr-only">Cargando…</span>}
    </div>
  );
}
```

- [ ] **Step 3: Typecheck + lint.** Run: `pnpm --filter product-photos typecheck && pnpm --filter product-photos lint`

- [ ] **Step 4: Commit**

```bash
git add apps/product-photos/src/components/ui apps/product-photos/src/lib/cn.ts
git commit -m "Add UI primitives (Button, Card, Field, SegmentedControl, Spinner)"
```

---

### Task 21: Landing page

**Files:**
- Create: `apps/product-photos/src/components/landing/LandingHero.tsx`, `apps/product-photos/src/components/landing/BeforeAfter.tsx`
- Modify: `apps/product-photos/src/app/page.tsx`
- Copy: `apps/web/public/images/featured-product/before.jpg` + `after.jpg` → `apps/product-photos/public/images/demo/before.jpg` + `after.jpg`

**Interfaces:**
- `LandingHero` — server component. Renders brand wordmark ("Novalup AI" white + "Product Photos" accent), `copy.landing.headline` (h1), `copy.landing.subheadline`, primary CTA `Button href="/signup"` with `copy.landing.cta`, and secondary links to `/login` + `/signup`. Includes `<BeforeAfter />`.
- `BeforeAfter` — client component: two `next/image` (or `<img>`) with a draggable divider, or (simpler, acceptable) a static side-by-side with "Antes"/"Después" labels from `copy.landing.demoBefore/demoAfter`. Ship the static version; a slider is optional polish.

- [ ] **Step 1: Copy the demo images**

```bash
mkdir -p apps/product-photos/public/images/demo
cp apps/web/public/images/featured-product/before.jpg apps/product-photos/public/images/demo/before.jpg
cp apps/web/public/images/featured-product/after.jpg apps/product-photos/public/images/demo/after.jpg
```

- [ ] **Step 2: Implement `BeforeAfter.tsx`** (static side-by-side)

```tsx
import Image from "next/image";
import copy from "@/content/copy";

export function BeforeAfter() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {([["before", copy.landing.demoBefore], ["after", copy.landing.demoAfter]] as const).map(([k, label]) => (
        <figure key={k} className="overflow-hidden rounded-2xl border border-white/[0.08]">
          <Image src={`/images/demo/${k}.jpg`} alt={label} width={640} height={640} className="h-full w-full object-cover" />
          <figcaption className="bg-night-card px-4 py-2 text-sm text-neutral-400">{label}</figcaption>
        </figure>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Implement `LandingHero.tsx` and wire `app/page.tsx`**

```tsx
// src/components/landing/LandingHero.tsx
import { Button } from "@/components/ui/Button";
import { BeforeAfter } from "@/components/landing/BeforeAfter";
import copy from "@/content/copy";

export function LandingHero() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-14 px-6 py-16 md:py-24">
      <header className="flex items-center justify-between">
        <span className="text-lg font-bold tracking-tight">
          {copy.brand.name} <span className="text-accent-light">{copy.brand.product}</span>
        </span>
        <nav className="flex items-center gap-3 text-sm">
          <a href="/login" className="text-neutral-300 hover:text-white">{copy.landing.login}</a>
          <Button href="/signup" size="md">{copy.landing.signup}</Button>
        </nav>
      </header>

      <div className="flex flex-col gap-6">
        <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight md:text-6xl">
          {copy.landing.headline}
        </h1>
        <p className="max-w-xl text-lg text-neutral-400">{copy.landing.subheadline}</p>
        <div>
          <Button href="/signup" size="lg">{copy.landing.cta}</Button>
        </div>
      </div>

      <BeforeAfter />
    </main>
  );
}
```

```tsx
// src/app/page.tsx
import { LandingHero } from "@/components/landing/LandingHero";
export default function LandingPage() {
  return <LandingHero />;
}
```

- [ ] **Step 4: Manual check.** `pnpm --filter product-photos dev` → `/` renders hero + before/after, CTA → `/signup`, responsive at 375px.

- [ ] **Step 5: Commit**

```bash
git add apps/product-photos/src/app/page.tsx apps/product-photos/src/components/landing apps/product-photos/public/images
git commit -m "Add Product Photos landing page"
```

---

### Task 22: Login and signup screens

**Files:**
- Create: `apps/product-photos/src/components/auth/GoogleButton.tsx`, `apps/product-photos/src/components/auth/AuthForm.tsx`
- Create: `apps/product-photos/src/app/login/page.tsx`, `apps/product-photos/src/app/signup/page.tsx`

**Interfaces:**
- `GoogleButton` — client. `onClick` → `signIn("google", { callbackUrl: "/app" })` from `next-auth/react`. Label `copy.auth.google`.
- `AuthForm` — client. Prop `mode: "login" | "signup"`.
  - `login`: email + password → `signIn("credentials", { email, password, redirect: false })`; on `res?.error` show `copy.errors.invalidCredentials`; on ok `router.push("/app")`.
  - `signup`: name + email + password + confirm → client-side check `password === confirmPassword` (`copy.errors.passwordMismatch`) → `POST /api/auth/signup`; on `409` show `copy.errors.emailTaken`; on `201` immediately `signIn("credentials", { email, password, redirect: false })` then `router.push("/app")`.
  - Uses `Field` + `inputClass` + `Button`. Disables submit while pending.

- [ ] **Step 1: Implement `GoogleButton.tsx`**

```tsx
"use client";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import copy from "@/content/copy";

export function GoogleButton() {
  return (
    <Button type="button" variant="outline" className="w-full" onClick={() => signIn("google", { callbackUrl: "/app" })}>
      {copy.auth.google}
    </Button>
  );
}
```

- [ ] **Step 2: Implement `AuthForm.tsx`**

```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Field, inputClass } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import copy from "@/content/copy";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const data = new FormData(e.currentTarget);
    const email = String(data.get("email"));
    const password = String(data.get("password"));
    setPending(true);
    try {
      if (mode === "signup") {
        if (password !== String(data.get("confirmPassword"))) {
          setError(copy.errors.passwordMismatch);
          return;
        }
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: data.get("name"), email, password, confirmPassword: data.get("confirmPassword") }),
        });
        if (res.status === 409) { setError(copy.errors.emailTaken); return; }
        if (!res.ok) { setError(copy.errors.generic); return; }
      }
      const res = await signIn("credentials", { email, password, redirect: false });
      if (res?.error) { setError(mode === "login" ? copy.errors.invalidCredentials : copy.errors.generic); return; }
      router.push("/app");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {mode === "signup" && (
        <Field label={copy.auth.name} htmlFor="name">
          <input id="name" name="name" required minLength={2} className={inputClass} />
        </Field>
      )}
      <Field label={copy.auth.email} htmlFor="email">
        <input id="email" name="email" type="email" required className={inputClass} />
      </Field>
      <Field label={copy.auth.password} htmlFor="password">
        <input id="password" name="password" type="password" required minLength={mode === "signup" ? 8 : 1} className={inputClass} />
      </Field>
      {mode === "signup" && (
        <Field label={copy.auth.confirmPassword} htmlFor="confirmPassword" error={error ?? undefined}>
          <input id="confirmPassword" name="confirmPassword" type="password" required minLength={8} className={inputClass} />
        </Field>
      )}
      {mode === "login" && error ? <p className="text-sm text-accent-light">{error}</p> : null}
      <Button type="submit" disabled={pending} className="w-full">
        {mode === "login" ? copy.auth.submitLogin : copy.auth.submitSignup}
      </Button>
    </form>
  );
}
```

- [ ] **Step 3: Implement the two pages**

```tsx
// src/app/login/page.tsx
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { AuthForm } from "@/components/auth/AuthForm";
import { GoogleButton } from "@/components/auth/GoogleButton";
import copy from "@/content/copy";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6 py-12">
      <h1 className="text-2xl font-bold">{copy.auth.loginTitle}</h1>
      <Card className="flex flex-col gap-5">
        <GoogleButton />
        <div className="text-center text-xs uppercase tracking-wide text-neutral-500">{copy.auth.or}</div>
        <AuthForm mode="login" />
      </Card>
      <p className="text-sm text-neutral-400">
        {copy.auth.noAccount} <Link href="/signup" className="text-accent-light hover:underline">{copy.landing.signup}</Link>
      </p>
    </main>
  );
}
```

```tsx
// src/app/signup/page.tsx  (same shape, mode="signup", copy.auth.signupTitle, link to /login with copy.auth.haveAccount)
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { AuthForm } from "@/components/auth/AuthForm";
import { GoogleButton } from "@/components/auth/GoogleButton";
import copy from "@/content/copy";

export default function SignupPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6 py-12">
      <h1 className="text-2xl font-bold">{copy.auth.signupTitle}</h1>
      <Card className="flex flex-col gap-5">
        <GoogleButton />
        <div className="text-center text-xs uppercase tracking-wide text-neutral-500">{copy.auth.or}</div>
        <AuthForm mode="signup" />
      </Card>
      <p className="text-sm text-neutral-400">
        {copy.auth.haveAccount} <Link href="/login" className="text-accent-light hover:underline">{copy.landing.login}</Link>
      </p>
    </main>
  );
}
```

- [ ] **Step 4: Add `SessionProvider`** — wrap `src/app/layout.tsx` body children with a client `<Providers>` that renders `next-auth/react`'s `SessionProvider` (needed for `signIn` and `useSession`). Create `src/app/providers.tsx` (`"use client"`).

```tsx
// src/app/providers.tsx
"use client";
import { SessionProvider } from "next-auth/react";
export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

Wrap in `layout.tsx`: `<body ...><Providers>{children}</Providers></body>`.

- [ ] **Step 5: Manual check** — sign up with email → lands on `/app`; log out (Task 23) then log in; Google button works; duplicate email shows the error; mismatched passwords show the error.

- [ ] **Step 6: Commit**

```bash
git add apps/product-photos/src/app/login apps/product-photos/src/app/signup apps/product-photos/src/components/auth apps/product-photos/src/app/providers.tsx apps/product-photos/src/app/layout.tsx
git commit -m "Add login and signup screens"
```

---

### Task 23: Dashboard shell (`/app` layout with auth guard + header)

**Files:**
- Create: `apps/product-photos/src/app/app/layout.tsx`, `apps/product-photos/src/components/tool/DashboardHeader.tsx`, `apps/product-photos/src/components/tool/UserMenu.tsx`

**Interfaces:**
- `src/app/app/layout.tsx` — server. `const user = await requireUser(); if (!user) redirect("/login");` Reads `credits` via `getCredits(user.id)`. Renders `<DashboardHeader name={user.name} email={user.email} credits={credits} />` + `{children}` in a centered `max-w-3xl` column.
- `DashboardHeader` — server. Left: "Novalup AI" wordmark. Right: credits pill (`copy.credits.freeLabel(n)` when `n === FREE_CREDITS` else `copy.credits.remainingLabel(n)`) + `<UserMenu />`.
- `UserMenu` — client. Avatar button → dropdown with name, email, "Cerrar sesión" → `signOut({ callbackUrl: "/" })`.
- The `/app` page reads credits again per generation via the poll response; the header count is server-rendered on load and refreshed via `router.refresh()` after a completed generation.

- [ ] **Step 1: Implement `UserMenu.tsx`**

```tsx
"use client";
import { useState } from "react";
import { signOut } from "next-auth/react";
import copy from "@/content/copy";

export function UserMenu({ name, email }: { name: string | null; email: string }) {
  const [open, setOpen] = useState(false);
  const initial = (name ?? email).charAt(0).toUpperCase();
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20 text-sm font-semibold text-white"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {initial}
      </button>
      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-56 rounded-xl border border-white/10 bg-night-card p-3 text-sm shadow-xl">
          <p className="truncate font-medium text-white">{name ?? email}</p>
          <p className="truncate text-neutral-400">{email}</p>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="mt-3 w-full rounded-lg px-3 py-2 text-left text-neutral-300 hover:bg-white/[0.06]"
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Implement `DashboardHeader.tsx`**

```tsx
import { UserMenu } from "@/components/tool/UserMenu";
import { FREE_CREDITS } from "@/lib/credits/config";
import copy from "@/content/copy";

export function DashboardHeader({ name, email, credits }: { name: string | null; email: string; credits: number }) {
  const label = credits === FREE_CREDITS ? copy.credits.freeLabel(credits) : copy.credits.remainingLabel(credits);
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-night/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-6">
        <span className="font-bold tracking-tight">{copy.brand.name}</span>
        <div className="flex items-center gap-4">
          <span className="rounded-full border border-white/12 px-3 py-1.5 text-sm text-neutral-300">{label}</span>
          <UserMenu name={name} email={email} />
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 3: Implement `src/app/app/layout.tsx`**

```tsx
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getCredits } from "@/lib/credits/service";
import { DashboardHeader } from "@/components/tool/DashboardHeader";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  if (!user) redirect("/login");
  const credits = await getCredits(user.id);

  return (
    <>
      <DashboardHeader name={user.name} email={user.email} credits={credits} />
      <main className="mx-auto max-w-3xl px-6 py-10">{children}</main>
    </>
  );
}
```

- [ ] **Step 4: Manual check** — `/app` shows header with "3 créditos gratis" + avatar menu; "Cerrar sesión" returns to `/`.

- [ ] **Step 5: Commit**

```bash
git add apps/product-photos/src/app/app/layout.tsx apps/product-photos/src/components/tool/DashboardHeader.tsx apps/product-photos/src/components/tool/UserMenu.tsx
git commit -m "Add dashboard shell with auth guard and credits header"
```

---

### Task 24: Uploader component

**Files:**
- Create: `apps/product-photos/src/components/tool/Uploader.tsx`

**Interfaces:**
- `Uploader` — client. Props: `value: File | null`, `onChange: (file: File | null) => void`.
- Drag & drop + click-to-browse (`<input type="file" accept="image/jpeg,image/png,image/webp">`). On a chosen file, validate client-side with `assertValidImage` — on failure call `onChange(null)` and show `copy.errors.invalidImage`. On success, show a local preview via `URL.createObjectURL` (revoke on change/unmount) and a `copy.tool.changeImage` button. **No upload happens here.**

- [ ] **Step 1: Implement `Uploader.tsx`**

```tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { assertValidImage } from "@/lib/validation/upload";
import copy from "@/content/copy";
import { cn } from "@/lib/cn";

export function Uploader({ value, onChange }: { value: File | null; onChange: (f: File | null) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!value) { setPreview(null); return; }
    const url = URL.createObjectURL(value);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  function accept(file: File | undefined) {
    setError(null);
    if (!file) return;
    const check = assertValidImage({ type: file.type, size: file.size });
    if (!check.ok) { setError(copy.errors.invalidImage); onChange(null); return; }
    onChange(file);
  }

  if (value && preview) {
    return (
      <div className="flex flex-col gap-3">
        <div className="overflow-hidden rounded-2xl border border-white/[0.08]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="preview" className="max-h-80 w-full object-contain bg-night-soft" />
        </div>
        <button type="button" onClick={() => onChange(null)} className="self-start text-sm text-accent-light hover:underline">
          {copy.tool.changeImage}
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); accept(e.dataTransfer.files[0]); }}
        className={cn(
          "flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-colors",
          dragging ? "border-accent bg-accent/5" : "border-white/15 hover:border-white/30",
        )}
      >
        <span className="text-neutral-200">{copy.tool.uploadHint}</span>
        <span className="text-sm text-neutral-500">{copy.tool.uploadFormats}</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => accept(e.target.files?.[0])}
      />
      {error ? <p className="mt-2 text-sm text-accent-light">{error}</p> : null}
    </div>
  );
}
```

- [ ] **Step 2: Manual check** — drag a PNG → preview; drop a PDF → error; "Cambiar imagen" clears it.

- [ ] **Step 3: Commit**

```bash
git add apps/product-photos/src/components/tool/Uploader.tsx
git commit -m "Add product image uploader with local preview"
```

---

### Task 25: Option picker component

**Files:**
- Create: `apps/product-photos/src/components/tool/OptionPicker.tsx`

**Interfaces:**
- `OptionPicker` — client. Props: `value: OptionValue` (exported type `{ format: FormatId | null; style: StyleId | null; background: BackgroundId | null; instructions: string }`), `onChange: (patch: Partial<OptionValue>) => void`.
- Renders three `SegmentedControl`s over `FORMATS` / `STYLES` / `BACKGROUNDS`, with option labels read from `copy.tool.formats[id]` / `copy.tool.styles[id]` / `copy.tool.backgrounds[id]` and group labels from `copy.tool.formatLabel/styleLabel/backgroundLabel`, plus a `<textarea>` for instructions (`copy.tool.instructionsLabel`, placeholder `copy.tool.instructionsPlaceholder`, `maxLength={1000}`).

- [ ] **Step 1: Implement `OptionPicker.tsx`**

```tsx
"use client";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Field, inputClass } from "@/components/ui/Field";
import { FORMATS, STYLES, BACKGROUNDS } from "@/lib/ai/options";
import type { FormatId, StyleId, BackgroundId } from "@/lib/ai/options";
import copy from "@/content/copy";

export type OptionValue = {
  format: FormatId | null;
  style: StyleId | null;
  background: BackgroundId | null;
  instructions: string;
};

export function OptionPicker({
  value, onChange,
}: { value: OptionValue; onChange: (patch: Partial<OptionValue>) => void }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-neutral-300">{copy.tool.formatLabel}</span>
        <SegmentedControl
          ariaLabel={copy.tool.formatLabel}
          options={FORMATS.map((f) => ({ value: f.id, label: copy.tool.formats[f.id] }))}
          value={value.format}
          onChange={(v) => onChange({ format: v })}
        />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-neutral-300">{copy.tool.styleLabel}</span>
        <SegmentedControl
          ariaLabel={copy.tool.styleLabel}
          options={STYLES.map((s) => ({ value: s, label: copy.tool.styles[s] }))}
          value={value.style}
          onChange={(v) => onChange({ style: v })}
        />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-neutral-300">{copy.tool.backgroundLabel}</span>
        <SegmentedControl
          ariaLabel={copy.tool.backgroundLabel}
          options={BACKGROUNDS.map((b) => ({ value: b, label: copy.tool.backgrounds[b] }))}
          value={value.background}
          onChange={(v) => onChange({ background: v })}
        />
      </div>
      <Field label={copy.tool.instructionsLabel} htmlFor="instructions">
        <textarea
          id="instructions"
          className={inputClass}
          rows={3}
          maxLength={1000}
          placeholder={copy.tool.instructionsPlaceholder}
          value={value.instructions}
          onChange={(e) => onChange({ instructions: e.target.value })}
        />
      </Field>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/product-photos/src/components/tool/OptionPicker.tsx
git commit -m "Add generation option picker"
```

---

### Task 26: Generation hook, generate panel, result card

**Files:**
- Create: `apps/product-photos/src/hooks/useGeneration.ts`, `apps/product-photos/src/components/tool/GeneratePanel.tsx`, `apps/product-photos/src/components/tool/ResultCard.tsx`
- Test: `apps/product-photos/src/hooks/useGeneration.test.ts`

**Interfaces:**
- `useGeneration()` returns:
  ```ts
  {
    state: "idle" | "starting" | "generating" | "completed" | "failed" | "out_of_credits";
    result: { generatedImageUrl: string; creditsRemaining: number } | null;
    error: string | null;
    start(args: { image: File; format: string; style: string; background: string; instructions: string }): Promise<void>;
    reset(): void;
  }
  ```
  - `start` builds `FormData`, `POST /api/generations`. On `403 NO_CREDITS` → `state = "out_of_credits"`. On `409` → `error = copy.errors.inProgress`, `state = "failed"`. On `201` → `state = "generating"` and begins polling `GET /api/generations/:id` every 2000ms.
  - Poll `completed` → `state = "completed"`, `result` set. Poll `failed` → `state = "failed"`, `error = copy.errors.generationFailed`. Polls stop on unmount (`AbortController` + cleared interval).
- `GeneratePanel` — client. Props: `disabled: boolean` (true until image + format + style + background chosen), `onGenerate: () => void`, `pending: boolean`. Renders the `Button` with `copy.tool.generate`; while `pending` shows `<Spinner label={copy.tool.generating} />` and disables.
- `ResultCard` — client. Props: `imageUrl: string`, `generationId: string`, `creditsRemaining: number`, `onAgain: () => void`, `onAnother: () => void`. Big `<img>`, `copy.tool.creditUsed(creditsRemaining)`, buttons: `copy.tool.generateAgain` (`onAgain`), `copy.tool.download` (link to `${imageUrl}?download=1`), `copy.tool.createAnother` (`onAnother`).

- [ ] **Step 1: Add test deps for the hook** — `pnpm --filter product-photos add -D jsdom @testing-library/react @testing-library/dom`. (Commit `pnpm-lock.yaml` with this task.)

- [ ] **Step 2: Write the failing test for the hook** (`environment: jsdom` for this file — add `// @vitest-environment jsdom` at the top; use `@testing-library/react`'s `renderHook`)

```ts
// @vitest-environment jsdom
// src/hooks/useGeneration.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useGeneration } from "@/hooks/useGeneration";

const file = new File([new Uint8Array([1, 2, 3])], "p.png", { type: "image/png" });
const args = { image: file, format: "1:1", style: "studio", background: "clean", instructions: "" };

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

describe("useGeneration", () => {
  it("goes to out_of_credits on a 403 NO_CREDITS", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ code: "NO_CREDITS" }), { status: 403 }),
    );
    const { result } = renderHook(() => useGeneration());
    await act(async () => { await result.current.start(args); });
    expect(result.current.state).toBe("out_of_credits");
  });

  it("polls until completed", async () => {
    const fetchMock = vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "g1" }), { status: 201 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: "pending" }), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ status: "completed", generatedImageUrl: "/api/media/g1/generated", creditsRemaining: 2 }), { status: 200 }),
      );
    const { result } = renderHook(() => useGeneration());
    await act(async () => { await result.current.start(args); });
    expect(result.current.state).toBe("generating");
    await act(async () => { await vi.advanceTimersByTimeAsync(2000); });
    await act(async () => { await vi.advanceTimersByTimeAsync(2000); });
    await waitFor(() => expect(result.current.state).toBe("completed"));
    expect(result.current.result).toEqual({ generatedImageUrl: "/api/media/g1/generated", creditsRemaining: 2 });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
```

- [ ] **Step 3: Run test → FAIL.** Run: `pnpm --filter product-photos test -- useGeneration`

- [ ] **Step 4: Implement `useGeneration.ts`**

```ts
"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import copy from "@/content/copy";

type State = "idle" | "starting" | "generating" | "completed" | "failed" | "out_of_credits";
type Result = { generatedImageUrl: string; creditsRemaining: number };

export function useGeneration() {
  const [state, setState] = useState<State>("idle");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const active = useRef(true);

  const stop = useCallback(() => {
    if (timer.current) { clearInterval(timer.current); timer.current = null; }
  }, []);

  useEffect(() => () => { active.current = false; stop(); }, [stop]);

  const reset = useCallback(() => {
    stop();
    setState("idle");
    setResult(null);
    setError(null);
  }, [stop]);

  const poll = useCallback((id: string) => {
    timer.current = setInterval(async () => {
      const res = await fetch(`/api/generations/${id}`);
      if (!active.current) return;
      if (!res.ok) return;
      const body = await res.json();
      if (body.status === "completed") {
        stop();
        setResult({ generatedImageUrl: body.generatedImageUrl, creditsRemaining: body.creditsRemaining });
        setState("completed");
      } else if (body.status === "failed") {
        stop();
        setError(copy.errors.generationFailed);
        setState("failed");
      }
    }, 2000);
  }, [stop]);

  const start = useCallback(async (args: {
    image: File; format: string; style: string; background: string; instructions: string;
  }) => {
    setState("starting");
    setError(null);
    setResult(null);
    const form = new FormData();
    form.set("image", args.image);
    form.set("format", args.format);
    form.set("style", args.style);
    form.set("background", args.background);
    if (args.instructions.trim()) form.set("instructions", args.instructions.trim());

    const res = await fetch("/api/generations", { method: "POST", body: form });
    if (res.status === 403) { setState("out_of_credits"); return; }
    if (res.status === 409) { setError(copy.errors.inProgress); setState("failed"); return; }
    if (!res.ok) { setError(copy.errors.generic); setState("failed"); return; }
    const { id } = await res.json();
    setState("generating");
    poll(id);
  }, [poll]);

  return { state, result, error, start, reset };
}
```

- [ ] **Step 5: Run test → PASS.** Run: `pnpm --filter product-photos test -- useGeneration`

- [ ] **Step 6: Implement `GeneratePanel.tsx` and `ResultCard.tsx`**

```tsx
// src/components/tool/GeneratePanel.tsx
"use client";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import copy from "@/content/copy";

export function GeneratePanel({
  disabled, pending, onGenerate,
}: { disabled: boolean; pending: boolean; onGenerate: () => void }) {
  if (pending) return <Spinner label={copy.tool.generating} />;
  return (
    <Button size="lg" disabled={disabled} onClick={onGenerate} className="w-full sm:w-auto">
      {copy.tool.generate}
    </Button>
  );
}
```

```tsx
// src/components/tool/ResultCard.tsx
"use client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import copy from "@/content/copy";

export function ResultCard({
  imageUrl, creditsRemaining, onAgain, onAnother,
}: { imageUrl: string; creditsRemaining: number; onAgain: () => void; onAnother: () => void }) {
  return (
    <Card className="flex flex-col gap-5">
      <h2 className="text-lg font-semibold">{copy.tool.resultTitle}</h2>
      <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-night-soft">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt={copy.tool.resultTitle} className="mx-auto max-h-[70vh] w-full object-contain" />
      </div>
      <p className="text-sm text-neutral-400">{copy.tool.creditUsed(creditsRemaining)}</p>
      <div className="flex flex-wrap gap-3">
        <Button onClick={onAgain}>{copy.tool.generateAgain}</Button>
        <Button variant="outline" href={`${imageUrl}?download=1`}>{copy.tool.download}</Button>
        <Button variant="ghost" onClick={onAnother}>{copy.tool.createAnother}</Button>
      </div>
    </Card>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add apps/product-photos/src/hooks apps/product-photos/src/components/tool/GeneratePanel.tsx apps/product-photos/src/components/tool/ResultCard.tsx apps/product-photos/package.json pnpm-lock.yaml
git commit -m "Add generation polling hook, generate panel, and result card"
```

---

### Task 27: Out-of-credits card + feedback form, and the `/app` page assembly

**Files:**
- Create: `apps/product-photos/src/components/tool/FeedbackForm.tsx`, `apps/product-photos/src/components/tool/OutOfCreditsCard.tsx`, `apps/product-photos/src/components/tool/ProductPhotoTool.tsx`
- Create: `apps/product-photos/src/app/app/page.tsx`

**Interfaces:**
- `FeedbackForm` — client. Props: `defaultName: string`, `defaultEmail: string`. Fields: name, email, thoughts (`copy.feedback.thoughts`), nextIdeas (`copy.feedback.nextIdeas`). Submit → `POST /api/feedback`. On success replace the form with `copy.feedback.thanksTitle` + `copy.feedback.thanksBody`.
- `OutOfCreditsCard` — client. Props: `name`, `email`. Renders `copy.outOfCredits.title` + `.body` + `<FeedbackForm />`.
- `ProductPhotoTool` — client. Props: `initialCredits: number`, `user: { name: string | null; email: string }`. Owns: `file`, `options` (`OptionValue`), and `useGeneration()`. Layout: title/subtitle → `Uploader` → (if file) `OptionPicker` → `GeneratePanel` → on `completed` `ResultCard` → on `out_of_credits` OR `initialCredits <= 0` `OutOfCreditsCard`. `generateAgain` re-runs `start` with the same inputs; `createAnother` calls `reset()` + clears `file`/`options`. After a completed generation, call `router.refresh()` so the header credits update.
- `src/app/app/page.tsx` — server. `requireUser()` (already guarded by layout, re-read for props), `getCredits`, render `<ProductPhotoTool initialCredits={credits} user={{...}} />`.

- [ ] **Step 1: Implement `FeedbackForm.tsx`**

```tsx
"use client";
import { useState } from "react";
import { Field, inputClass } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import copy from "@/content/copy";

export function FeedbackForm({ defaultName, defaultEmail }: { defaultName: string; defaultEmail: string }) {
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (done) {
    return (
      <div className="flex flex-col gap-2">
        <p className="font-semibold text-white">{copy.feedback.thanksTitle}</p>
        <p className="text-sm text-neutral-400">{copy.feedback.thanksBody}</p>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const data = new FormData(e.currentTarget);
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.get("name"), email: data.get("email"),
        thoughts: data.get("thoughts"), nextIdeas: data.get("nextIdeas"),
      }),
    });
    setPending(false);
    if (res.ok) setDone(true);
    else setError(copy.errors.generic);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <p className="font-medium text-white">{copy.feedback.title}</p>
      <Field label={copy.feedback.name} htmlFor="fb-name">
        <input id="fb-name" name="name" defaultValue={defaultName} required className={inputClass} />
      </Field>
      <Field label={copy.feedback.email} htmlFor="fb-email">
        <input id="fb-email" name="email" type="email" defaultValue={defaultEmail} required className={inputClass} />
      </Field>
      <Field label={copy.feedback.thoughts} htmlFor="fb-thoughts">
        <textarea id="fb-thoughts" name="thoughts" rows={3} required maxLength={2000} className={inputClass} />
      </Field>
      <Field label={copy.feedback.nextIdeas} htmlFor="fb-next" error={error ?? undefined}>
        <textarea id="fb-next" name="nextIdeas" rows={2} required maxLength={2000} className={inputClass} />
      </Field>
      <Button type="submit" disabled={pending}>{pending ? copy.feedback.sending : copy.feedback.submit}</Button>
    </form>
  );
}
```

- [ ] **Step 2: Implement `OutOfCreditsCard.tsx`**

```tsx
import { Card } from "@/components/ui/Card";
import { FeedbackForm } from "@/components/tool/FeedbackForm";
import copy from "@/content/copy";

export function OutOfCreditsCard({ name, email }: { name: string | null; email: string }) {
  return (
    <Card className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">{copy.outOfCredits.title}</h2>
        <p className="text-sm text-neutral-400">{copy.outOfCredits.body}</p>
      </div>
      <FeedbackForm defaultName={name ?? ""} defaultEmail={email} />
    </Card>
  );
}
```

- [ ] **Step 3: Implement `ProductPhotoTool.tsx`**

```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Uploader } from "@/components/tool/Uploader";
import { OptionPicker, type OptionValue } from "@/components/tool/OptionPicker";
import { GeneratePanel } from "@/components/tool/GeneratePanel";
import { ResultCard } from "@/components/tool/ResultCard";
import { OutOfCreditsCard } from "@/components/tool/OutOfCreditsCard";
import { useGeneration } from "@/hooks/useGeneration";
import copy from "@/content/copy";

const EMPTY: OptionValue = { format: null, style: null, background: null, instructions: "" };

export function ProductPhotoTool({
  initialCredits, user,
}: { initialCredits: number; user: { name: string | null; email: string } }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [options, setOptions] = useState<OptionValue>(EMPTY);
  const { state, result, error, start, reset } = useGeneration();

  if (initialCredits <= 0 && state !== "completed") {
    return <OutOfCreditsCard name={user.name} email={user.email} />;
  }
  if (state === "out_of_credits") {
    return <OutOfCreditsCard name={user.name} email={user.email} />;
  }

  const ready = Boolean(file && options.format && options.style && options.background);
  const pending = state === "starting" || state === "generating";

  async function generate() {
    if (!file || !options.format || !options.style || !options.background) return;
    await start({
      image: file,
      format: options.format,
      style: options.style,
      background: options.background,
      instructions: options.instructions,
    });
    router.refresh();
  }

  if (state === "completed" && result) {
    return (
      <ResultCard
        imageUrl={result.generatedImageUrl}
        creditsRemaining={result.creditsRemaining}
        onAgain={generate}
        onAnother={() => { reset(); setFile(null); setOptions(EMPTY); }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">{copy.tool.title}</h1>
        <p className="text-neutral-400">{copy.tool.subtitle}</p>
      </div>
      <Uploader value={file} onChange={setFile} />
      {file && <OptionPicker value={options} onChange={(patch) => setOptions((o) => ({ ...o, ...patch }))} />}
      {file && <GeneratePanel disabled={!ready || pending} pending={pending} onGenerate={generate} />}
      {state === "failed" && error ? <p className="text-sm text-accent-light">{error}</p> : null}
    </div>
  );
}
```

- [ ] **Step 4: Implement `src/app/app/page.tsx`**

```tsx
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getCredits } from "@/lib/credits/service";
import { ProductPhotoTool } from "@/components/tool/ProductPhotoTool";

export default async function AppPage() {
  const user = await requireUser();
  if (!user) redirect("/login");
  const credits = await getCredits(user.id);
  return <ProductPhotoTool initialCredits={credits} user={{ name: user.name, email: user.email }} />;
}
```

- [ ] **Step 5: Full test + typecheck + lint.** Run: `pnpm --filter product-photos test && pnpm --filter product-photos typecheck && pnpm --filter product-photos lint`

- [ ] **Step 6: Commit**

```bash
git add apps/product-photos/src/components/tool apps/product-photos/src/app/app/page.tsx
git commit -m "Assemble the Product Photo tool: upload → options → generate → result / feedback"
```

---

## Phase G — Docker, docs, and wiring

### Task 28: Dockerfile for the tool app

**Files:**
- Create: `apps/product-photos/Dockerfile`, `apps/product-photos/.dockerignore`
- Modify: `.gitignore` (already covers `.data`)

**Interfaces:**
- Produces an image that, given the env vars from `.env`, runs `prisma migrate deploy` then `next start -p 3000 -H 0.0.0.0`, serving the app on container port `3000`. Persists uploaded/generated images under `/data` (mounted volume, `STORAGE_DIR=/data`).

- [ ] **Step 1: Create `apps/product-photos/.dockerignore`**

```
node_modules
.next
.data
.env
*.log
```

- [ ] **Step 2: Create `apps/product-photos/Dockerfile`**

```dockerfile
# Build + run the product-photos app from the monorepo root context.
FROM node:20-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /repo

FROM base AS build
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json ./
COPY packages ./packages
COPY apps/product-photos ./apps/product-photos
RUN pnpm install --frozen-lockfile --filter product-photos...
RUN pnpm --filter product-photos build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=build /repo /repo
WORKDIR /repo/apps/product-photos
EXPOSE 3000
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && pnpm exec next start -p 3000 -H 0.0.0.0"]
```

> The build context is the **repo root** (set in `docker-compose.yml`). Keeping full `node_modules` (no `output: standalone`) trades image size for a Dockerfile that reliably resolves the `@novalup/brand` workspace dependency and the Prisma CLI. Acceptable for a locally-run MVP.
>
> Fallback if `prisma migrate deploy` in the `CMD` is flaky: drop it from `CMD` and run `docker compose run --rm product-photos pnpm exec prisma migrate deploy` as a documented step (Task 30 README already lists the manual command).

- [ ] **Step 3: Build the image**

Run: `docker build -f apps/product-photos/Dockerfile -t novalup-product-photos .`
Expected: build succeeds through both stages.

- [ ] **Step 4: Commit**

```bash
git add apps/product-photos/Dockerfile apps/product-photos/.dockerignore
git commit -m "Add Dockerfile for the product-photos app"
```

---

### Task 29: Docker Compose (postgres + product-photos)

**Files:**
- Create: `docker-compose.yml`, `.env.example` (root — identical to `apps/product-photos/.env.example`)
- Create: `.env` locally (gitignored) for the run

**Interfaces:**
- `docker compose up --build` starts `postgres` (healthchecked) then `product-photos`, which applies migrations and serves `http://localhost:3000`.
- Named volumes: `pgdata` (Postgres), `media` (→ `/data` in the app, `STORAGE_DIR=/data`).

- [ ] **Step 1: Create `docker-compose.yml`**

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-novalup}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-novalup}
      POSTGRES_DB: ${POSTGRES_DB:-product_photos}
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-novalup} -d ${POSTGRES_DB:-product_photos}"]
      interval: 5s
      timeout: 5s
      retries: 10

  product-photos:
    build:
      context: .
      dockerfile: apps/product-photos/Dockerfile
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER:-novalup}:${POSTGRES_PASSWORD:-novalup}@postgres:5432/${POSTGRES_DB:-product_photos}
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      NEXTAUTH_URL: ${NEXTAUTH_URL:-http://localhost:3000}
      AUTH_TRUST_HOST: "true"
      GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}
      GOOGLE_CLIENT_SECRET: ${GOOGLE_CLIENT_SECRET}
      KIE_API_KEY: ${KIE_API_KEY}
      KIE_BASE_URL: ${KIE_BASE_URL:-https://api.kie.ai}
      KIE_UPLOAD_URL: ${KIE_UPLOAD_URL:-https://kieai.redpandaai.co/api/file-stream-upload}
      KIE_MODEL: ${KIE_MODEL:-nano-banana-2}
      KIE_RESOLUTION: ${KIE_RESOLUTION:-2K}
      FORMSUBMIT_EMAIL: ${FORMSUBMIT_EMAIL}
      FREE_CREDITS: ${FREE_CREDITS:-3}
      MAX_UPLOAD_MB: ${MAX_UPLOAD_MB:-10}
      STORAGE_DIR: /data
    ports:
      - "3000:3000"
    volumes:
      - media:/data

volumes:
  pgdata:
  media:
```

- [ ] **Step 2: Create the root `.env.example`**

Same content as `apps/product-photos/.env.example` from Task 3 Step 10, plus:

```
POSTGRES_USER=novalup
POSTGRES_PASSWORD=novalup
POSTGRES_DB=product_photos
```

and change `DATABASE_URL` guidance: for `docker compose`, the app service sets `DATABASE_URL` itself (host `postgres`); for local `pnpm dev`, use `postgresql://novalup:novalup@localhost:5432/product_photos`.

- [ ] **Step 3: Run the stack**

```bash
cp .env.example .env   # fill NEXTAUTH_SECRET, GOOGLE_*, KIE_API_KEY, FORMSUBMIT_EMAIL
docker compose up --build
```

Expected: `postgres` becomes healthy, `product-photos` runs `prisma migrate deploy` (creating tables), then serves. Open `http://localhost:3000/` → landing renders.

- [ ] **Step 4: Verify persistence**

`docker compose down` then `docker compose up` (no `--build`): the app starts, `migrate deploy` reports no pending migrations, previously created users still exist.

- [ ] **Step 5: Commit**

```bash
git add docker-compose.yml .env.example
git commit -m "Add Docker Compose stack (postgres + product-photos)"
```

---

### Task 30: README and homepage link wiring

**Files:**
- Create: `README.md` (repo root) — or update if one exists
- Modify: `apps/web/src/components/home/*` and `apps/web/src/app/[locale]/product-photos/page.tsx` — point the Product Photos CTA at `NEXT_PUBLIC_PRODUCT_PHOTOS_URL`
- Modify: `apps/web/.env.example` (create) with `NEXT_PUBLIC_PRODUCT_PHOTOS_URL=http://localhost:3000`

**Interfaces:**
- `apps/web` gains one env var, `NEXT_PUBLIC_PRODUCT_PHOTOS_URL` (default to `http://localhost:3000` when unset, so the homepage still builds without an env file). Add a tiny helper `apps/web/src/lib/constants.ts` export: `export const PRODUCT_PHOTOS_URL = process.env.NEXT_PUBLIC_PRODUCT_PHOTOS_URL ?? "http://localhost:3000";`

- [ ] **Step 1: Find the Product Photos CTAs in `apps/web`**

Run: `rg -n "product-photos|Product Photos|/product-photos" apps/web/src`
Identify every link that should now go to the tool app (the featured-product CTA, the product card for `product-photos`, any "try it" button). Leave the marketing nav/anchors alone.

- [ ] **Step 2: Add the constant and repoint the links**

Add `PRODUCT_PHOTOS_URL` to `apps/web/src/lib/constants.ts`. For the `product-photos` product card and the featured CTA, render an external `<a href={PRODUCT_PHOTOS_URL}>` instead of the localized `<Link href="/product-photos">`. The `/product-photos` placeholder page keeps existing but its primary button becomes `<a href={PRODUCT_PHOTOS_URL}>`.

- [ ] **Step 3: Verify `apps/web` still builds**

Run: `pnpm --filter web build`
Expected: clean.

- [ ] **Step 4: Write `README.md`**

````markdown
# Novalup AI — monorepo

pnpm workspaces:

- `apps/web` — marketing homepage (Next.js, `next-intl`, port 3100)
- `apps/product-photos` — the AI Product Photos MVP (Next.js, Prisma, Auth.js, port 3000)
- `packages/brand` — shared Tailwind preset

## Product Photos — run locally with Docker

1. **Create `.env`:** `cp .env.example .env`
2. **Google OAuth:** create an OAuth client (Web) in Google Cloud Console.
   Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`.
   Put the id/secret in `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.
   Generate `NEXTAUTH_SECRET` with `openssl rand -base64 32`.
3. **Kie.ai:** create an API key at kie.ai and set `KIE_API_KEY`. The app
   uses model `nano-banana-2`.
4. **FormSubmit:** set `FORMSUBMIT_EMAIL` to the address that should receive
   feedback. FormSubmit sends a one-time confirmation email the first time
   the app posts feedback — click the link in it to activate delivery.
5. **Run:** `docker compose up --build` → open `http://localhost:3000`
6. **Migrations:** run automatically on container start
   (`prisma migrate deploy`). To run them manually:
   `docker compose run --rm product-photos pnpm exec prisma migrate deploy`.
   To create a new migration during development:
   `pnpm --filter product-photos prisma migrate dev --name <name>`
   (needs a local Postgres — `docker compose up postgres`).

## Local development without Docker

```bash
pnpm install
docker compose up -d postgres
# apps/product-photos/.env → DATABASE_URL=postgresql://novalup:novalup@localhost:5432/product_photos
pnpm --filter product-photos prisma migrate dev
pnpm dev:photos        # http://localhost:3000
pnpm dev:web           # http://localhost:3100
```

## Tests

`pnpm --filter product-photos test`
````

- [ ] **Step 5: Commit**

```bash
git add README.md apps/web/src apps/web/.env.example
git commit -m "Add README and point the homepage CTA at the Product Photos app"
```

---

### Task 31: Full verification pass

**Files:** none (verification only). Fix-forward with small commits if anything fails.

- [ ] **Step 1: Monorepo-wide checks**

Run: `pnpm -r typecheck && pnpm -r lint && pnpm -r test && pnpm -r build`
Expected: all green for both `web` and `product-photos`.

- [ ] **Step 2: Clean Docker run**

```bash
docker compose down -v
docker compose up --build
```

Expected: fresh DB, migrations apply, app serves.

- [ ] **Step 3: End-to-end manual flow** (against the Docker app, with a real `KIE_API_KEY`)

1. `/` landing → "Crear cuenta" → sign up with email/password → lands on `/app`.
2. Header shows **"3 créditos gratis"**.
3. Upload a product JPG → preview shows.
4. Pick format `1:1`, style `Studio`, background `Clean`.
5. "Generar foto" → "Creando tu foto de producto…" → result image appears; line reads **"1 crédito usado · Te quedan 2 créditos"**; header now shows **"2 créditos restantes"**.
6. "Descargar" downloads the PNG.
7. "Generar de nuevo" consumes another credit (→ 1). "Crear otra" resets the form; generate once more (→ 0).
8. Next generate attempt: the **"Te quedaste sin créditos gratis"** card appears with the feedback form (name/email prefilled).
9. Submit feedback → **"¡Gracias por tu feedback!"**; the configured `FORMSUBMIT_EMAIL` receives it (after one-time activation).
10. `POST /api/generations` directly (e.g. `curl` with the session cookie) returns `403 {"code":"NO_CREDITS"}`.

- [ ] **Step 4: Security spot-checks**

- Log in as a second user; `GET /api/generations/<first-user-generation-id>` → `404`.
- `GET /api/media/<first-user-generation-id>/generated` as the second user → `404`.
- `POST /api/generations` with no session → `401`.
- Confirm `KIE_API_KEY` / `FORMSUBMIT_EMAIL` never appear in any client bundle: `rg -n "KIE_API_KEY|FORMSUBMIT_EMAIL" apps/product-photos/.next` returns nothing.
- Upload a 20 MB file → `422 invalid_image`.

- [ ] **Step 5: Homepage regression**

`pnpm dev:web` → homepage renders in `es` and `en`; the Product Photos CTA opens `http://localhost:3000`.

- [ ] **Step 6: Final commit (if fixes were made)**

```bash
git add -A
git commit -m "Fix issues found in the full verification pass"
```

---

## Self-Review

**1. Spec coverage**

| Spec section | Task(s) |
|---|---|
| §1 landing (headline, subheadline, CTA, before/after, login/signup) | 21, 22 |
| §2 auth (Google, email/password; structure ready for more) | 12, 13, 14 |
| §3 credits (`FREE_CREDITS` constant, `User.credits`, display) | 4, 7, 13, 14, 23 |
| §4 credit rule (server check, decrement on success only, in a transaction) | 7, 17, 18 |
| §5 generator screen (title/subtitle, upload, preview, drag & drop) | 24, 27 |
| §6 options (format / style / background / instructions) | 5, 25 |
| §7 generate (button, loading, no concurrent, provider isolated) | 17, 26, 10 |
| §8 internal prompt (preservation block + per-style) | 6 |
| §9 result (image, again/download/another, "1 credit used", "X remaining") | 26 |
| §10 out-of-credits screen + feedback form (FormSubmit, env, thanks) | 11, 19, 27 |
| §11 real block at 0 credits (`403 NO_CREDITS`) | 17, 26, 27 |
| §12 DB (Postgres, Prisma, minimal models, indexes) | 4 |
| §13 Docker (`app` + `postgres`, `docker compose up`, documented steps) | 28, 29, 30 |
| §14 `.env.example` (no real secrets) | 3, 29 |
| §15 UI/UX (premium, minimal, responsive, no dashboard clutter) | 20–27 (+ `frontend-design` pass) |
| §16 minimal dashboard (header, `X credits`, avatar menu) | 23 |
| §17 security (backend auth, resource authz, input validation, size limits, server-only key, no client trust) | 13, 15, 16, 17, 18, 31 |
| §18 architecture (auth / db / AI / image / credits / feedback separated, not over-built) | file structure + Phase C–E |
| §19 not-built list | Global Constraints + no task builds any of it |
| §20 end-to-end flow | 31 Step 3 |
| Monorepo `apps/<product>` | 1, 2, 3 |

No gaps.

**2. Placeholder scan** — no "TBD"/"TODO"/"handle edge cases"/"similar to Task N". Each code step carries full code. The two `frontend-design` references are a deliberate visual-polish pointer, not a missing spec.

**3. Type consistency**

- `FormatId | StyleId | BackgroundId` defined in Task 5, consumed unchanged in Tasks 6, 8, 25.
- `ProductPhotoProvider` / `JobResult` / `CreateJobInput` defined in Task 10, consumed in Tasks 17, 18.
- `createGeneration` return codes `NO_CREDITS | GENERATION_IN_PROGRESS | PROVIDER_ERROR` (Task 17) match the HTTP mapping in the same task and the client handling in Task 26 (`403` → `out_of_credits`, `409` → in-progress).
- `pollGeneration` `PollResult` (Task 18) matches the client poll parsing in Task 26 (`status: "completed" | "failed" | "pending"`).
- `consumeOneCredit(tx, userId)` signature identical in Tasks 7, 18.
- `mediaKey(id, kind, ext)` / `mediaApiUrl(id, kind)` / `readMedia(id, kind)` consistent across Tasks 9, 16, 17, 18.
- `copy.*` keys referenced in UI tasks all exist in the Task 3 `copy.ts`.
- `requireUser()` return shape `{ id, email, name }` identical in Tasks 13, 16, 17, 18, 19, 23, 27.

No inconsistencies found.








