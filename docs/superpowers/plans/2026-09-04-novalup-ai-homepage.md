# Novalup AI Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Novalup AI marketing homepage and product-hub shell (Next.js App Router, TypeScript, Tailwind, next-intl) with a data-driven product grid and placeholder routes for every future tool, in Spanish (default) and English.

**Architecture:** A single Next.js project rendering everything under `src/app/[locale]/...` via `next-intl` (Spanish unprefixed, English under `/en`). The homepage is composed from small section components (`src/components/home/*`) that read copy from `next-intl` message catalogs and structural data from `src/data/products.ts`. Five tool routes and three legal routes share one `PlaceholderPage` component so nothing 404s while the real tools/pages are built later. No backend, no CMS, no unit-test framework — verification is `tsc`/`lint` plus scripted `curl` checks against the dev server.

**Tech Stack:** Next.js (App Router) + TypeScript + Tailwind CSS v3.4 + `next-intl` (i18n routing/messages) + `lucide-react` (icons) + `pnpm`. No animation library — motion is CSS transitions/keyframes plus a small custom `IntersectionObserver` hook.

**Spec:** `docs/superpowers/specs/2026-09-04-novalup-ai-homepage-design.md`

## Global Constraints

- Spanish is the default locale, unprefixed (`/`, `/product-photos`); English is prefixed (`/en`, `/en/product-photos`). No automatic browser-language redirect — `localeDetection: false`.
- No wolf logo/mascot anywhere on Novalup AI — wordmark only ("Novalup" + accent "AI").
- No stock photography, no robots/brains/circuits imagery. Hero and before/after visuals are built from CSS/SVG shapes.
- `/product-photos`, `/cv`, `/study`, `/interview`, `/trading` render only a placeholder — the real tool platforms are separate, already-planned work. Do not build any generation logic.
- No unit-test framework is added. Verification per task is `tsc --noEmit`, `next lint`, and scripted `curl`/`grep` checks against the dev server (see each task's Verify step).
- No new dependencies beyond `next`, `react`, `react-dom`, `next-intl`, `lucide-react`, and their necessary devDependencies (`typescript`, `eslint` + `eslint-config-next`, `tailwindcss` + `postcss` + `autoprefixer`, `@eslint/eslintrc`, `@types/*`).
- Color tokens: `ink #0B0B0D`, `night #111111`, `night-card #18181B`, `paper #FAFAFA`, `paper-alt #F3F3F5`, `accent #e11d48` / `accent-dark #be123c` / `accent-light #fb7185`.
- Font: Inter via `next/font/google`.
- Package manager: `pnpm` for every command in this plan.

---

## Task 1: Project scaffold, design tokens, and i18n foundation

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `next-env.d.ts`
- Create: `postcss.config.mjs`
- Create: `tailwind.config.ts`
- Create: `eslint.config.mjs`
- Create: `.gitignore`
- Create: `src/app/globals.css`
- Create: `src/i18n/routing.ts`
- Create: `src/i18n/navigation.ts`
- Create: `src/i18n/request.ts`
- Create: `src/middleware.ts`
- Create: `src/lib/seo.ts`
- Create: `src/messages/es.json`
- Create: `src/messages/en.json`
- Create: `src/app/[locale]/layout.tsx`
- Create: `src/app/[locale]/page.tsx`

**Interfaces:**
- Produces: `routing` (from `src/i18n/routing.ts`, `{ locales: ['es','en'], defaultLocale: 'es' }`), `{ Link, redirect, usePathname, useRouter }` (from `src/i18n/navigation.ts`), `buildAlternates(pathname: string): { languages: { es: string; en: string } }` (from `src/lib/seo.ts`). Every later task's components/pages import these.
- Produces: Tailwind tokens `ink`, `night`, `night-card`, `paper`, `paper-alt`, `accent`/`accent.dark`/`accent.light`, `font-sans` (Inter), `animate-float`, and the `.reveal-on-scroll` CSS class — used by every later task.
- Produces: full `es`/`en` message catalogs under namespaces `nav`, `hero`, `products`, `featuredProduct`, `howItWorks`, `freeUsage`, `about`, `finalCta`, `footer`, `placeholder`, `legal`, `metadata` — later tasks read these via `useTranslations`/`getTranslations`, they do not add new top-level namespaces.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "novalup-ai",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
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
    "@eslint/eslintrc": "^3",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "autoprefixer": "^10",
    "eslint": "^8",
    "eslint-config-next": "^16.0.7",
    "postcss": "^8",
    "tailwindcss": "^3.4.1",
    "typescript": "^5"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run: `pnpm install`
Expected: lockfile `pnpm-lock.yaml` created, no errors.

- [ ] **Step 3: Create `tsconfig.json`**

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
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Create `next-env.d.ts`**

```ts
/// <reference types="next" />
/// <reference types="next/image-types/global" />
```

- [ ] **Step 5: Create `postcss.config.mjs`**

```js
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;
```

- [ ] **Step 6: Create `tailwind.config.ts`**

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0B0B0D",
        night: "#111111",
        "night-card": "#18181B",
        paper: "#FAFAFA",
        "paper-alt": "#F3F3F5",
        accent: {
          DEFAULT: "#e11d48",
          dark: "#be123c",
          light: "#fb7185",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 7: Create `eslint.config.mjs`**

```js
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
```

- [ ] **Step 8: Create `.gitignore`**

```
/node_modules
/.next/
/out/
/build

.DS_Store
*.pem

npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

.env*.local

*.tsbuildinfo
```

- [ ] **Step 9: Create `next.config.ts`**

```ts
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
```

- [ ] **Step 10: Create `src/i18n/routing.ts`**

```ts
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["es", "en"],
  defaultLocale: "es",
  localePrefix: "as-needed",
  localeDetection: false,
});
```

- [ ] **Step 11: Create `src/i18n/navigation.ts`**

```ts
import { createNavigation } from "next-intl/navigation";
import { routing } from "@/i18n/routing";

export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);
```

- [ ] **Step 12: Create `src/i18n/request.ts`**

```ts
import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
```

- [ ] **Step 13: Create `src/middleware.ts`**

```ts
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
```

- [ ] **Step 14: Create `src/lib/seo.ts`**

```ts
export function buildAlternates(pathname: string) {
  const path = pathname === "/" ? "" : pathname;

  return {
    languages: {
      es: path || "/",
      en: `/en${path}`,
    },
  };
}
```

- [ ] **Step 15: Create `src/messages/es.json`**

```json
{
  "nav": {
    "products": "Productos",
    "howItWorks": "Cómo funciona",
    "about": "Sobre Novalup AI",
    "tryTool": "Probar una herramienta",
    "openMenu": "Abrir menú",
    "closeMenu": "Cerrar menú"
  },
  "hero": {
    "headline": "Herramientas de IA que realmente hacen algo.",
    "subheadline": "Herramientas simples con inteligencia artificial, pensadas para resolver problemas reales en segundos.",
    "ctaPrimary": "Explorar herramientas",
    "ctaSecondary": "Probar gratis"
  },
  "products": {
    "heading": "Herramientas creadas para resolver problemas reales.",
    "subheading": "Explorá nuestra colección de herramientas con inteligencia artificial, en constante crecimiento.",
    "statusAvailable": "Disponible",
    "statusComingSoon": "Próximamente",
    "items": {
      "product-photos": {
        "name": "Fotos de Producto con IA",
        "description": "Convertí fotos comunes de tus productos en imágenes profesionales con IA.",
        "cta": "Probar Fotos de Producto"
      },
      "cv-analyzer": {
        "name": "Analizador de CV con IA",
        "description": "Analizá tu CV, descubrí puntos débiles y mejorá tus chances de conseguir entrevistas.",
        "cta": "Probar Analizador de CV"
      },
      "study-assistant": {
        "name": "Asistente de Estudio con IA",
        "description": "Convertí tus apuntes en resúmenes, tarjetas de estudio y exámenes de práctica.",
        "cta": "Probar Asistente de Estudio"
      },
      "interview-simulator": {
        "name": "Simulador de Entrevistas con IA",
        "description": "Practicá entrevistas laborales realistas y recibí feedback al instante.",
        "cta": "Probar Simulador de Entrevistas"
      },
      "trading-analytics": {
        "name": "Analítica de Trading",
        "description": "Analizá tu historial de trading y descubrí patrones en tu rendimiento.",
        "cta": "Probar Analítica de Trading"
      }
    }
  },
  "featuredProduct": {
    "eyebrow": "Herramienta destacada",
    "heading": "Fotos de Producto con IA",
    "beforeLabel": "Antes",
    "afterLabel": "Después",
    "step1": "Subí una foto de tu producto.",
    "step2": "Elegí un estilo.",
    "step3": "Generá una imagen profesional.",
    "cta": "Probar gratis"
  },
  "howItWorks": {
    "heading": "Cómo funciona",
    "step1Title": "Elegí una herramienta",
    "step1Body": "Elegí la herramienta de IA que necesitás.",
    "step2Title": "Subí o describí",
    "step2Body": "Dale a la herramienta la información que necesita.",
    "step3Title": "Obtené tu resultado",
    "step3Body": "Generá tu resultado en segundos.",
    "step4Title": "Seguí creando",
    "step4Body": "Usá más herramientas cuando las necesites."
  },
  "freeUsage": {
    "heading": "Probalo antes de pagar.",
    "body": "Cada herramienta de Novalup AI incluye uso gratuito para que veas el resultado antes de comprar más generaciones."
  },
  "about": {
    "heading": "Sobre Novalup AI",
    "body": "Novalup AI es una colección creciente de herramientas prácticas de inteligencia artificial, creadas para hacer las tareas cotidianas más rápidas, simples y accesibles."
  },
  "finalCta": {
    "heading": "Encontrá una herramienta. Probala. Conseguí resultados.",
    "subheading": "Explorá Novalup AI y empezá a crear.",
    "cta": "Explorar herramientas"
  },
  "footer": {
    "products": "Productos",
    "about": "Sobre nosotros",
    "terms": "Términos",
    "privacy": "Privacidad",
    "contact": "Contacto",
    "partOf": "Parte de Novalup."
  },
  "placeholder": {
    "badge": "Muy pronto",
    "backHome": "Volver al inicio",
    "toolMessage": "Esta herramienta está en construcción. Muy pronto vas a poder usarla acá."
  },
  "legal": {
    "terms": {
      "name": "Términos y condiciones",
      "message": "Estamos preparando esta página. Volvé pronto."
    },
    "privacy": {
      "name": "Política de privacidad",
      "message": "Estamos preparando esta página. Volvé pronto."
    },
    "contact": {
      "name": "Contacto",
      "message": "Estamos preparando esta página. Volvé pronto."
    }
  },
  "metadata": {
    "title": "Novalup AI — Herramientas de IA que realmente hacen algo",
    "description": "Herramientas prácticas de inteligencia artificial para el trabajo, la creatividad, el estudio y la vida diaria."
  }
}
```

- [ ] **Step 16: Create `src/messages/en.json`**

```json
{
  "nav": {
    "products": "Products",
    "howItWorks": "How it works",
    "about": "About Novalup AI",
    "tryTool": "Try a tool",
    "openMenu": "Open menu",
    "closeMenu": "Close menu"
  },
  "hero": {
    "headline": "AI tools that actually do something.",
    "subheadline": "Simple AI-powered tools designed to solve real problems in seconds.",
    "ctaPrimary": "Explore tools",
    "ctaSecondary": "Try for free"
  },
  "products": {
    "heading": "Tools built to solve real problems.",
    "subheading": "Explore our growing collection of AI-powered tools.",
    "statusAvailable": "Available",
    "statusComingSoon": "Coming soon",
    "items": {
      "product-photos": {
        "name": "AI Product Photos",
        "description": "Turn ordinary product photos into professional images with AI.",
        "cta": "Try Product Photos"
      },
      "cv-analyzer": {
        "name": "AI CV Analyzer",
        "description": "Analyze your CV, discover weaknesses and improve your chances of getting interviews.",
        "cta": "Try CV Analyzer"
      },
      "study-assistant": {
        "name": "AI Study Assistant",
        "description": "Turn your notes into summaries, flashcards and practice exams.",
        "cta": "Try Study Assistant"
      },
      "interview-simulator": {
        "name": "AI Interview Simulator",
        "description": "Practice realistic job interviews and get instant feedback.",
        "cta": "Try Interview Simulator"
      },
      "trading-analytics": {
        "name": "Trading Analytics",
        "description": "Analyze your trading history and discover patterns in your performance.",
        "cta": "Try Trading Analytics"
      }
    }
  },
  "featuredProduct": {
    "eyebrow": "Featured tool",
    "heading": "AI Product Photos",
    "beforeLabel": "Before",
    "afterLabel": "After",
    "step1": "Upload a product photo.",
    "step2": "Choose a style.",
    "step3": "Generate a professional image.",
    "cta": "Try it free"
  },
  "howItWorks": {
    "heading": "How it works",
    "step1Title": "Choose a tool",
    "step1Body": "Pick the AI tool you need.",
    "step2Title": "Upload or describe",
    "step2Body": "Give the tool the information it needs.",
    "step3Title": "Get your result",
    "step3Body": "Generate your result in seconds.",
    "step4Title": "Keep creating",
    "step4Body": "Use more tools whenever you need them."
  },
  "freeUsage": {
    "heading": "Try before you pay.",
    "body": "Every Novalup AI tool includes free usage so you can see the result before purchasing more generations."
  },
  "about": {
    "heading": "About Novalup AI",
    "body": "Novalup AI is a growing collection of practical AI tools built to make everyday tasks faster, easier and more accessible."
  },
  "finalCta": {
    "heading": "Find a tool. Try it. Get something done.",
    "subheading": "Explore Novalup AI and start creating.",
    "cta": "Explore tools"
  },
  "footer": {
    "products": "Products",
    "about": "About",
    "terms": "Terms",
    "privacy": "Privacy",
    "contact": "Contact",
    "partOf": "Part of Novalup."
  },
  "placeholder": {
    "badge": "Coming very soon",
    "backHome": "Back to home",
    "toolMessage": "This tool is being built. You'll be able to use it here very soon."
  },
  "legal": {
    "terms": {
      "name": "Terms & conditions",
      "message": "We're putting this page together. Check back soon."
    },
    "privacy": {
      "name": "Privacy policy",
      "message": "We're putting this page together. Check back soon."
    },
    "contact": {
      "name": "Contact",
      "message": "We're putting this page together. Check back soon."
    }
  },
  "metadata": {
    "title": "Novalup AI — AI Tools That Actually Do Something",
    "description": "Practical AI tools for work, creativity, learning and everyday tasks."
  }
}
```

- [ ] **Step 17: Create `src/app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background-color: #fafafa;
}

html {
  scroll-behavior: smooth;
}

.reveal-on-scroll {
  transition-property: opacity, transform;
  transition-duration: 700ms;
  transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
}

@media (prefers-reduced-motion: reduce) {
  .reveal-on-scroll {
    transition: none !important;
    opacity: 1 !important;
    transform: none !important;
  }

  .animate-float {
    animation: none !important;
  }
}
```

- [ ] **Step 18: Create `src/app/[locale]/layout.tsx`**

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { buildAlternates } from "@/lib/seo";
import "../globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });

  return {
    metadataBase: new URL("https://novalup.ai"),
    title: {
      default: t("title"),
      template: "%s — Novalup AI",
    },
    description: t("description"),
    alternates: buildAlternates("/"),
    openGraph: {
      title: t("title"),
      description: t("description"),
      siteName: "Novalup AI",
      locale: locale === "es" ? "es_AR" : "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  return (
    <html lang={locale} className={inter.variable}>
      <body className="bg-paper font-sans text-ink antialiased">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 19: Create `src/app/[locale]/page.tsx` (temporary minimal home, replaced fully in Task 10)**

```tsx
import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";

type Props = { params: Promise<{ locale: string }> };

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <TempHome />;
}

function TempHome() {
  const t = useTranslations("hero");
  return (
    <main className="flex min-h-screen items-center justify-center bg-ink">
      <h1 className="text-4xl font-bold text-white">{t("headline")}</h1>
    </main>
  );
}
```

- [ ] **Step 20: Verify the foundation works end to end**

Run:
```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm dev &
sleep 4
curl -s http://localhost:3000/ | grep -o 'lang="es"'
curl -s http://localhost:3000/ | grep -o "Herramientas de IA que realmente hacen algo"
curl -s http://localhost:3000/en | grep -o 'lang="en"'
curl -s http://localhost:3000/en | grep -o "AI tools that actually do something"
kill %1
```
Expected: `tsc`/`lint` report no errors; both `curl` calls for `/` print `lang="es"` and the Spanish headline; both calls for `/en` print `lang="en"` and the English headline.

- [ ] **Step 21: Commit**

```bash
git add package.json pnpm-lock.yaml tsconfig.json next.config.ts next-env.d.ts postcss.config.mjs tailwind.config.ts eslint.config.mjs .gitignore src/
git commit -m "$(cat <<'EOF'
Scaffold Next.js project with design tokens and next-intl i18n foundation

Sets up TypeScript, Tailwind color tokens, and Spanish-default/English
locale routing so every later task can build on a working bilingual
skeleton.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_016PbVQjaJ6cn8PjBCuJUN5X
EOF
)"
```

---

## Task 2: Shared UI primitives (Button, Container, SectionHeading, scroll-reveal)

**Files:**
- Create: `src/components/ui/Button.tsx`
- Create: `src/components/ui/Container.tsx`
- Create: `src/components/ui/SectionHeading.tsx`
- Create: `src/hooks/useInView.ts`
- Create: `src/components/ui/RevealOnScroll.tsx`
- Modify: `src/app/[locale]/page.tsx:1-19` (use these primitives to prove them out; still temporary, replaced in Task 10)

**Interfaces:**
- Consumes: `Link` from `@/i18n/navigation` (Task 1).
- Produces: `Button({ variant?: "primary" | "secondary" | "secondary-dark" | "text"; href?: string; className?: string; children; onClick?: () => void; type?: "button" | "submit" })`, `Container({ children; className? })`, `SectionHeading({ eyebrow?; heading; subheading?; align?: "left" | "center"; tone?: "light" | "dark" })`, `useInView<T extends HTMLElement>(options?: IntersectionObserverInit): { ref: RefObject<T | null>; isInView: boolean }`, `RevealOnScroll({ children; className?; delayMs? })` — every later home-section task uses all five.

- [ ] **Step 1: Create `src/components/ui/Button.tsx`**

```tsx
import { Link } from "@/i18n/navigation";

type Variant = "primary" | "secondary" | "secondary-dark" | "text";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all duration-200 ease-out";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-gradient-to-br from-accent to-accent-dark text-white shadow-[0_8px_24px_-8px_rgba(225,29,72,0.5)] hover:shadow-[0_10px_28px_-6px_rgba(225,29,72,0.6)] hover:-translate-y-0.5",
  secondary:
    "border border-neutral-300 text-ink hover:border-ink hover:-translate-y-0.5",
  "secondary-dark":
    "border border-white/30 text-white hover:border-white hover:-translate-y-0.5",
  text: "px-0 py-0 text-ink underline-offset-4 hover:underline",
};

interface ButtonProps {
  variant?: Variant;
  href?: string;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
}

export function Button({
  variant = "primary",
  href,
  className = "",
  children,
  onClick,
  type = "button",
}: ButtonProps) {
  const classes = `${BASE} ${VARIANTS[variant]} ${className}`;

  if (href?.startsWith("#")) {
    return (
      <a href={href} onClick={onClick} className={classes}>
        {children}
      </a>
    );
  }

  if (href) {
    return (
      <Link href={href} onClick={onClick} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} className={classes}>
      {children}
    </button>
  );
}
```

- [ ] **Step 2: Create `src/components/ui/Container.tsx`**

```tsx
export function Container({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-7xl px-6 md:px-10 ${className}`}>
      {children}
    </div>
  );
}
```

- [ ] **Step 3: Create `src/components/ui/SectionHeading.tsx`**

```tsx
interface SectionHeadingProps {
  eyebrow?: string;
  heading: string;
  subheading?: string;
  align?: "left" | "center";
  tone?: "light" | "dark";
}

export function SectionHeading({
  eyebrow,
  heading,
  subheading,
  align = "center",
  tone = "light",
}: SectionHeadingProps) {
  const alignClasses =
    align === "center" ? "text-center items-center" : "text-left items-start";
  const headingColor = tone === "dark" ? "text-white" : "text-ink";
  const subColor = tone === "dark" ? "text-neutral-400" : "text-neutral-500";

  return (
    <div className={`flex flex-col gap-4 ${alignClasses}`}>
      {eyebrow && (
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          {eyebrow}
        </span>
      )}
      <h2
        className={`text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl ${headingColor}`}
      >
        {heading}
      </h2>
      {subheading && (
        <p className={`max-w-2xl text-lg ${subColor}`}>{subheading}</p>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create `src/hooks/useInView.ts`**

```ts
"use client";

import { useEffect, useRef, useState } from "react";

export function useInView<T extends HTMLElement>(
  options?: IntersectionObserverInit
) {
  const ref = useRef<T | null>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, ...options }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [options]);

  return { ref, isInView };
}
```

- [ ] **Step 5: Create `src/components/ui/RevealOnScroll.tsx`**

```tsx
"use client";

import { useInView } from "@/hooks/useInView";

export function RevealOnScroll({
  children,
  className = "",
  delayMs = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
}) {
  const { ref, isInView } = useInView<HTMLDivElement>();

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delayMs}ms` }}
      className={`reveal-on-scroll ${
        isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
      } ${className}`}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 6: Wire the primitives into the temporary home page to prove them out**

Replace `src/app/[locale]/page.tsx` step-19 content with:

```tsx
import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";

type Props = { params: Promise<{ locale: string }> };

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <TempHome />;
}

function TempHome() {
  const t = useTranslations("hero");
  return (
    <main className="min-h-screen bg-ink py-24">
      <Container>
        <RevealOnScroll className="flex flex-col items-center gap-6 text-center">
          <SectionHeading heading={t("headline")} tone="dark" />
          <Button href="/#products" variant="primary">
            {t("ctaPrimary")}
          </Button>
        </RevealOnScroll>
      </Container>
    </main>
  );
}
```

- [ ] **Step 7: Verify**

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm dev &
sleep 4
curl -s http://localhost:3000/ | grep -o "reveal-on-scroll"
curl -s http://localhost:3000/ | grep -o "rounded-full"
kill %1
```
Expected: no type/lint errors; both `grep` calls print a match, confirming `RevealOnScroll` and `Button` rendered.

- [ ] **Step 8: Commit**

```bash
git add src/components/ui src/hooks src/app/[locale]/page.tsx
git commit -m "$(cat <<'EOF'
Add shared UI primitives: Button, Container, SectionHeading, RevealOnScroll

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_016PbVQjaJ6cn8PjBCuJUN5X
EOF
)"
```

---

## Task 3: Site constants, Navbar, mobile menu, and locale toggle

**Files:**
- Create: `src/lib/constants.ts`
- Create: `src/components/layout/LocaleToggle.tsx`
- Create: `src/components/layout/MobileMenu.tsx`
- Create: `src/components/layout/Navbar.tsx`
- Modify: `src/app/[locale]/layout.tsx:44-50` (render `<Navbar />` above `{children}`)

**Interfaces:**
- Consumes: `Link`, `usePathname`, `useRouter` from `@/i18n/navigation` (Task 1); `Button`, `Container` from `@/components/ui/*` (Task 2); `nav.*` message keys (Task 1).
- Produces: `NAV_LINKS: { key: string; href: string }[]` and `FOOTER_LINKS: { key: string; href: string }[]` (from `src/lib/constants.ts`) — Task 4's `Footer` consumes `FOOTER_LINKS`. Produces `<Navbar />` (no props) rendered by the root layout for every route.

- [ ] **Step 1: Create `src/lib/constants.ts`**

```ts
export const SITE_NAME = "Novalup AI";

export const NAV_LINKS = [
  { key: "products", href: "/#products" },
  { key: "howItWorks", href: "/#how-it-works" },
  { key: "about", href: "/#about" },
] as const;

export const FOOTER_LINKS = [
  { key: "products", href: "/#products" },
  { key: "about", href: "/#about" },
  { key: "terms", href: "/terms" },
  { key: "privacy", href: "/privacy" },
  { key: "contact", href: "/contact" },
] as const;
```

- [ ] **Step 2: Create `src/components/layout/LocaleToggle.tsx`**

```tsx
"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";

export function LocaleToggle() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const nextLocale = locale === "es" ? "en" : "es";

  return (
    <button
      type="button"
      onClick={() => router.replace(pathname, { locale: nextLocale })}
      className="rounded-full border border-neutral-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-ink transition-colors hover:border-ink"
      aria-label={`Switch to ${nextLocale === "es" ? "Español" : "English"}`}
    >
      {nextLocale.toUpperCase()}
    </button>
  );
}
```

- [ ] **Step 3: Create `src/components/layout/MobileMenu.tsx`**

```tsx
"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { NAV_LINKS } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { LocaleToggle } from "@/components/layout/LocaleToggle";

export function MobileMenu({ onNavigate }: { onNavigate: () => void }) {
  const t = useTranslations("nav");

  return (
    <div className="border-t border-neutral-200 bg-paper md:hidden">
      <Container className="flex flex-col gap-6 py-6">
        <nav className="flex flex-col gap-4">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              onClick={onNavigate}
              className="text-base font-medium text-ink"
            >
              {t(link.key)}
            </Link>
          ))}
        </nav>
        <div className="flex items-center justify-between">
          <LocaleToggle />
          <Button href="/#products" variant="primary" onClick={onNavigate}>
            {t("tryTool")}
          </Button>
        </div>
      </Container>
    </div>
  );
}
```

- [ ] **Step 4: Create `src/components/layout/Navbar.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { NAV_LINKS } from "@/lib/constants";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { LocaleToggle } from "@/components/layout/LocaleToggle";
import { MobileMenu } from "@/components/layout/MobileMenu";

export function Navbar() {
  const t = useTranslations("nav");
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200/70 bg-paper/80 backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
        <Link
          href="/"
          onClick={() => setIsOpen(false)}
          className="flex items-center gap-1 text-lg font-bold tracking-tight"
        >
          <span className="text-ink">Novalup</span>
          <span className="text-accent">AI</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              className="text-sm font-medium text-neutral-600 transition-colors hover:text-ink"
            >
              {t(link.key)}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <LocaleToggle />
          <Button href="/#products" variant="primary" className="px-5 py-2.5 text-sm">
            {t("tryTool")}
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex h-10 w-10 items-center justify-center rounded-full text-ink md:hidden"
          aria-label={isOpen ? t("closeMenu") : t("openMenu")}
          aria-expanded={isOpen}
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </Container>

      {isOpen && <MobileMenu onNavigate={() => setIsOpen(false)} />}
    </header>
  );
}
```

- [ ] **Step 5: Render the Navbar from the root layout**

In `src/app/[locale]/layout.tsx`, add the import and wrap `{children}`:

```tsx
import { Navbar } from "@/components/layout/Navbar";
```

```tsx
      <body className="bg-paper font-sans text-ink antialiased">
        <NextIntlClientProvider>
          <Navbar />
          {children}
        </NextIntlClientProvider>
      </body>
```

- [ ] **Step 6: Verify**

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm dev &
sleep 4
curl -s http://localhost:3000/ | grep -o "Novalup"
curl -s http://localhost:3000/ | grep -o "Probar una herramienta"
curl -s http://localhost:3000/en | grep -o "Try a tool"
kill %1
```
Expected: no type/lint errors; `/` contains the wordmark and Spanish nav CTA text; `/en` contains the English nav CTA text.

- [ ] **Step 7: Commit**

```bash
git add src/lib/constants.ts src/components/layout src/app/[locale]/layout.tsx
git commit -m "$(cat <<'EOF'
Add Navbar with mobile menu and locale toggle

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_016PbVQjaJ6cn8PjBCuJUN5X
EOF
)"
```

---

## Task 4: Footer

**Files:**
- Create: `src/components/layout/Footer.tsx`
- Modify: `src/app/[locale]/layout.tsx:44-52` (render `<Footer />` after `{children}`)

**Interfaces:**
- Consumes: `FOOTER_LINKS` from `@/lib/constants` (Task 3), `Link` from `@/i18n/navigation`, `Container` from `@/components/ui/Container`, `footer.*` message keys (Task 1).
- Produces: `<Footer />` (no props) rendered by the root layout for every route.

- [ ] **Step 1: Create `src/components/layout/Footer.tsx`**

```tsx
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { FOOTER_LINKS } from "@/lib/constants";

export function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="border-t border-neutral-200 bg-paper">
      <Container className="flex flex-col gap-8 py-12 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-2">
          <span className="text-lg font-bold tracking-tight">
            <span className="text-ink">Novalup</span>
            <span className="text-accent">AI</span>
          </span>
          <p className="text-sm text-neutral-500">{t("partOf")}</p>
        </div>

        <nav className="flex flex-wrap gap-x-8 gap-y-3">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              className="text-sm font-medium text-neutral-600 transition-colors hover:text-ink"
            >
              {t(link.key)}
            </Link>
          ))}
        </nav>
      </Container>
    </footer>
  );
}
```

- [ ] **Step 2: Render the Footer from the root layout**

In `src/app/[locale]/layout.tsx`, add the import and place it after `{children}`:

```tsx
import { Footer } from "@/components/layout/Footer";
```

```tsx
      <body className="bg-paper font-sans text-ink antialiased">
        <NextIntlClientProvider>
          <Navbar />
          {children}
          <Footer />
        </NextIntlClientProvider>
      </body>
```

- [ ] **Step 3: Verify**

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm dev &
sleep 4
curl -s http://localhost:3000/ | grep -o "Parte de Novalup"
curl -s http://localhost:3000/en | grep -o "Part of Novalup"
kill %1
```
Expected: no type/lint errors; each locale shows its translated footer tagline.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/Footer.tsx src/app/[locale]/layout.tsx
git commit -m "$(cat <<'EOF'
Add Footer with product/legal links and Novalup attribution

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_016PbVQjaJ6cn8PjBCuJUN5X
EOF
)"
```

---

## Task 5: Product data model

**Files:**
- Create: `src/data/products.ts`

**Interfaces:**
- Produces: `type ProductStatus = "available" | "coming-soon"`, `interface Product { slug: string; href: string; status: ProductStatus; icon: LucideIcon; category: string; featured?: boolean }`, `products: Product[]` (5 entries, `product-photos` has `featured: true`). Task 6's `ProductCard`/`ProductGrid` and Task 11's placeholder routes iterate/look up this array by `slug`.

- [ ] **Step 1: Create `src/data/products.ts`**

```ts
import {
  Camera,
  FileText,
  GraduationCap,
  Mic,
  LineChart,
  type LucideIcon,
} from "lucide-react";

export type ProductStatus = "available" | "coming-soon";

export interface Product {
  slug: string;
  href: string;
  status: ProductStatus;
  icon: LucideIcon;
  category: string;
  featured?: boolean;
}

export const products: Product[] = [
  {
    slug: "product-photos",
    href: "/product-photos",
    status: "available",
    icon: Camera,
    category: "creative",
    featured: true,
  },
  {
    slug: "cv-analyzer",
    href: "/cv",
    status: "coming-soon",
    icon: FileText,
    category: "career",
  },
  {
    slug: "study-assistant",
    href: "/study",
    status: "coming-soon",
    icon: GraduationCap,
    category: "learning",
  },
  {
    slug: "interview-simulator",
    href: "/interview",
    status: "coming-soon",
    icon: Mic,
    category: "career",
  },
  {
    slug: "trading-analytics",
    href: "/trading",
    status: "coming-soon",
    icon: LineChart,
    category: "finance",
  },
];
```

Adding a new tool later means appending one object here plus one `items.<slug>` block per locale in `src/messages/*.json` — no component changes required.

- [ ] **Step 2: Verify**

```bash
pnpm exec tsc --noEmit
```
Expected: no type errors (confirms the `Product[]` shape and `lucide-react` icon imports are valid).

- [ ] **Step 3: Commit**

```bash
git add src/data/products.ts
git commit -m "$(cat <<'EOF'
Add product data model for the tool grid

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_016PbVQjaJ6cn8PjBCuJUN5X
EOF
)"
```

---

## Task 6: ProductCard, ProductGrid, and the Products homepage section

**Files:**
- Create: `src/components/home/ProductCard.tsx`
- Create: `src/components/home/ProductGrid.tsx`
- Modify: `src/app/[locale]/page.tsx` (render `<ProductGrid />` instead of the Task-2 temporary content)

**Interfaces:**
- Consumes: `products` from `@/data/products` (Task 5); `Link` from `@/i18n/navigation`; `Container`, `SectionHeading`, `RevealOnScroll` from `@/components/ui/*` (Task 2); `products.*` message keys (Task 1).
- Produces: `<ProductGrid />` (no props, renders a `<section id="products">`) — Task 10 assembles it into the final homepage in this exact form.

- [ ] **Step 1: Create `src/components/home/ProductCard.tsx`**

```tsx
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Product } from "@/data/products";

export function ProductCard({ product }: { product: Product }) {
  const t = useTranslations("products");
  const Icon = product.icon;
  const isAvailable = product.status === "available";

  return (
    <Link
      href={product.href}
      className="group flex flex-col gap-5 rounded-2xl border border-neutral-200 bg-white p-7 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_16px_32px_-16px_rgba(0,0,0,0.15)]"
    >
      <div className="flex items-center justify-between">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-paper-alt text-ink">
          <Icon size={20} strokeWidth={1.75} />
        </span>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            isAvailable
              ? "bg-accent-light/20 text-accent-dark"
              : "bg-neutral-100 text-neutral-500"
          }`}
        >
          {isAvailable ? t("statusAvailable") : t("statusComingSoon")}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-semibold text-ink">
          {t(`items.${product.slug}.name`)}
        </h3>
        <p className="text-sm leading-relaxed text-neutral-500">
          {t(`items.${product.slug}.description`)}
        </p>
      </div>

      <span className="mt-auto flex items-center gap-1 text-sm font-semibold text-accent transition-transform group-hover:translate-x-1">
        {t(`items.${product.slug}.cta`)} →
      </span>
    </Link>
  );
}
```

- [ ] **Step 2: Create `src/components/home/ProductGrid.tsx`**

```tsx
import { useTranslations } from "next-intl";
import { products } from "@/data/products";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { ProductCard } from "@/components/home/ProductCard";

export function ProductGrid() {
  const t = useTranslations("products");

  return (
    <section id="products" className="bg-paper py-24 md:py-32">
      <Container className="flex flex-col gap-14">
        <SectionHeading heading={t("heading")} subheading={t("subheading")} />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product, index) => (
            <RevealOnScroll key={product.slug} delayMs={index * 80}>
              <ProductCard product={product} />
            </RevealOnScroll>
          ))}
        </div>
      </Container>
    </section>
  );
}
```

- [ ] **Step 3: Replace the temporary homepage content**

Replace the body of `src/app/[locale]/page.tsx` (the `TempHome` function and its usage from Task 2) with:

```tsx
import { setRequestLocale } from "next-intl/server";
import { ProductGrid } from "@/components/home/ProductGrid";

type Props = { params: Promise<{ locale: string }> };

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <ProductGrid />
    </>
  );
}
```

(The `<>...</>` wrapper is intentional — Tasks 7-10 add sibling sections inside it.)

- [ ] **Step 4: Verify**

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm dev &
sleep 4
curl -s http://localhost:3000/ | grep -o "Fotos de Producto con IA"
curl -s http://localhost:3000/ | grep -o "Disponible"
curl -s http://localhost:3000/en | grep -o "Coming soon"
kill %1
```
Expected: no type/lint errors; `/` shows the Spanish product name and "Disponible" badge; `/en` shows "Coming soon" for at least one card.

- [ ] **Step 5: Commit**

```bash
git add src/components/home/ProductCard.tsx src/components/home/ProductGrid.tsx src/app/[locale]/page.tsx
git commit -m "$(cat <<'EOF'
Add ProductCard/ProductGrid and wire the Products section into the homepage

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_016PbVQjaJ6cn8PjBCuJUN5X
EOF
)"
```

---

## Task 7: Hero section with floating product-window mockups

**Files:**
- Create: `src/components/home/HeroMockups.tsx`
- Create: `src/components/home/Hero.tsx`
- Modify: `src/app/[locale]/page.tsx` (render `<Hero />` before `<ProductGrid />`)

**Interfaces:**
- Consumes: `Button`, `Container` from `@/components/ui/*` (Task 2); `hero.*` message keys (Task 1); `animate-float` Tailwind animation (Task 1).
- Produces: `<Hero />` (no props, renders a `<section>` with an `<h1>`) and `<HeroMockups />` (no props) — Task 10 assembles `<Hero />` as the first section of the homepage.

- [ ] **Step 1: Create `src/components/home/HeroMockups.tsx`**

```tsx
import { Camera, FileText, LineChart, Mic, Sparkles } from "lucide-react";

function CvScoreCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`w-44 rounded-xl border border-white/10 bg-night-card p-4 shadow-2xl animate-float ${className}`}
    >
      <div className="mb-3 flex items-center gap-2">
        <FileText size={14} className="text-accent-light" />
        <span className="text-xs font-medium text-neutral-300">CV Score</span>
      </div>
      <div className="mb-2 text-2xl font-bold text-white">
        82<span className="text-sm text-neutral-500">/100</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div className="h-full w-4/5 rounded-full bg-gradient-to-r from-accent to-accent-light" />
      </div>
    </div>
  );
}

function BeforeAfterCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`w-40 rounded-xl border border-white/10 bg-night-card p-3 shadow-2xl animate-float ${className}`}
    >
      <div className="mb-2 flex items-center gap-2">
        <Camera size={14} className="text-accent-light" />
        <span className="text-xs font-medium text-neutral-300">
          Product Photos
        </span>
      </div>
      <div className="flex gap-1.5">
        <div className="h-14 flex-1 rounded-md bg-neutral-700" />
        <div className="h-14 flex-1 rounded-md bg-gradient-to-br from-accent to-accent-dark" />
      </div>
    </div>
  );
}

function FlashcardCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`w-36 rounded-xl border border-white/10 bg-night-card p-4 shadow-2xl animate-float ${className}`}
    >
      <span className="text-xs font-medium text-neutral-300">
        Flashcard 3/12
      </span>
      <div className="mt-3 h-2 w-full rounded-full bg-white/10" />
      <div className="mt-2 h-2 w-2/3 rounded-full bg-white/10" />
    </div>
  );
}

function InterviewScoreCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`w-40 rounded-xl border border-white/10 bg-night-card p-4 shadow-2xl animate-float ${className}`}
    >
      <div className="mb-2 flex items-center gap-2">
        <Mic size={14} className="text-accent-light" />
        <span className="text-xs font-medium text-neutral-300">Interview</span>
      </div>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Sparkles
            key={star}
            size={12}
            className={star <= 4 ? "text-accent-light" : "text-neutral-700"}
          />
        ))}
      </div>
    </div>
  );
}

function AnalyticsCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`w-44 rounded-xl border border-white/10 bg-night-card p-4 shadow-2xl animate-float ${className}`}
    >
      <div className="mb-2 flex items-center gap-2">
        <LineChart size={14} className="text-accent-light" />
        <span className="text-xs font-medium text-neutral-300">Analytics</span>
      </div>
      <svg viewBox="0 0 100 30" className="h-8 w-full">
        <polyline
          points="0,25 20,18 35,20 50,10 65,14 80,5 100,8"
          fill="none"
          stroke="url(#sparkline-gradient)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <defs>
          <linearGradient id="sparkline-gradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#fb7185" />
            <stop offset="100%" stopColor="#e11d48" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

export function HeroMockups() {
  return (
    <>
      <div className="relative mx-auto hidden h-72 max-w-4xl lg:block">
        <CvScoreCard className="absolute left-0 top-4 [animation-delay:0s]" />
        <BeforeAfterCard className="absolute left-[22%] top-32 [animation-delay:1.2s]" />
        <FlashcardCard className="absolute left-1/2 top-0 -translate-x-1/2 [animation-delay:0.6s]" />
        <InterviewScoreCard className="absolute right-[22%] top-32 [animation-delay:1.8s]" />
        <AnalyticsCard className="absolute right-0 top-4 [animation-delay:2.4s]" />
      </div>

      <div className="mx-auto flex scale-90 items-start justify-center gap-3 lg:hidden">
        <BeforeAfterCard className="[animation-delay:0s]" />
        <CvScoreCard className="[animation-delay:0.8s]" />
      </div>
    </>
  );
}
```

- [ ] **Step 2: Create `src/components/home/Hero.tsx`**

```tsx
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { HeroMockups } from "@/components/home/HeroMockups";

export function Hero() {
  const t = useTranslations("hero");

  return (
    <section className="relative overflow-hidden bg-ink pb-20 pt-32 md:pb-32 md:pt-40">
      <Container className="relative z-10 flex flex-col items-center gap-8 text-center">
        <h1 className="max-w-4xl text-5xl font-extrabold tracking-tight text-white sm:text-6xl md:text-7xl lg:text-8xl">
          {t("headline")}
        </h1>
        <p className="max-w-xl text-lg text-neutral-400 md:text-xl">
          {t("subheadline")}
        </p>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Button href="/#products" variant="primary">
            {t("ctaPrimary")}
          </Button>
          <Button href="/#free-usage" variant="secondary-dark">
            {t("ctaSecondary")}
          </Button>
        </div>
      </Container>

      <div className="relative z-10 mt-16 md:mt-20">
        <HeroMockups />
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Add the Hero to the homepage**

In `src/app/[locale]/page.tsx`, import and render it before `<ProductGrid />`:

```tsx
import { Hero } from "@/components/home/Hero";
```

```tsx
  return (
    <>
      <Hero />
      <ProductGrid />
    </>
  );
```

- [ ] **Step 4: Verify**

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm dev &
sleep 4
curl -s http://localhost:3000/ | grep -o "Herramientas de IA que realmente hacen algo"
curl -s http://localhost:3000/ | grep -o "animate-float"
curl -s http://localhost:3000/en | grep -o "AI tools that actually do something"
kill %1
```
Expected: no type/lint errors; `/` contains the Spanish H1 and at least one `animate-float` mockup card; `/en` contains the English H1.

- [ ] **Step 5: Commit**

```bash
git add src/components/home/Hero.tsx src/components/home/HeroMockups.tsx src/app/[locale]/page.tsx
git commit -m "$(cat <<'EOF'
Add Hero section with floating product-window mockups

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_016PbVQjaJ6cn8PjBCuJUN5X
EOF
)"
```

---

## Task 8: FeaturedProduct — Product Photos before/after showcase

**Files:**
- Create: `src/components/home/FeaturedProduct.tsx`
- Modify: `src/app/[locale]/page.tsx` (render `<FeaturedProduct />` after `<ProductGrid />`)

**Interfaces:**
- Consumes: `Button`, `Container`, `RevealOnScroll` from `@/components/ui/*` (Task 2); `featuredProduct.*` message keys (Task 1); `ArrowRight` from `lucide-react`.
- Produces: `<FeaturedProduct />` (no props, renders a `<section>`) — Task 10 assembles it into the homepage in this exact form.

- [ ] **Step 1: Create `src/components/home/FeaturedProduct.tsx`**

```tsx
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";

function ProductSilhouette({ tone }: { tone: "before" | "after" }) {
  const isAfter = tone === "after";

  return (
    <svg viewBox="0 0 120 160" className="h-32 w-24 md:h-40 md:w-32" aria-hidden="true">
      <ellipse
        cx="60"
        cy="150"
        rx="34"
        ry={isAfter ? 8 : 5}
        fill={isAfter ? "url(#shadow-after)" : "#00000022"}
      />
      <rect
        x="30"
        y="40"
        width="60"
        height="100"
        rx="14"
        fill={isAfter ? "url(#bottle-after)" : "#B8B8BC"}
      />
      <rect
        x="45"
        y="18"
        width="30"
        height="26"
        rx="6"
        fill={isAfter ? "#be123c" : "#8A8A8E"}
      />
      <defs>
        <linearGradient id="bottle-after" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fb7185" />
          <stop offset="100%" stopColor="#e11d48" />
        </linearGradient>
        <radialGradient id="shadow-after">
          <stop offset="0%" stopColor="#e11d4855" />
          <stop offset="100%" stopColor="#e11d4800" />
        </radialGradient>
      </defs>
    </svg>
  );
}

export function FeaturedProduct() {
  const t = useTranslations("featuredProduct");

  return (
    <section className="bg-paper-alt py-24 md:py-32">
      <Container className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
        <RevealOnScroll className="order-2 lg:order-1">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            {t("eyebrow")}
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl md:text-5xl">
            {t("heading")}
          </h2>
          <ol className="mt-8 flex flex-col gap-4">
            {(["step1", "step2", "step3"] as const).map((key, index) => (
              <li key={key} className="flex items-start gap-4">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <p className="pt-1 text-base text-neutral-600">{t(key)}</p>
              </li>
            ))}
          </ol>
          <Button href="/product-photos" variant="primary" className="mt-10">
            {t("cta")}
          </Button>
        </RevealOnScroll>

        <RevealOnScroll className="order-1 flex items-center justify-center gap-6 lg:order-2">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-56 w-44 items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-100 shadow-sm md:h-64 md:w-52">
              <ProductSilhouette tone="before" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {t("beforeLabel")}
            </span>
          </div>

          <ArrowRight className="hidden h-6 w-6 flex-shrink-0 text-accent md:block" />

          <div className="flex flex-col items-center gap-3">
            <div className="flex h-56 w-44 items-center justify-center rounded-2xl bg-white shadow-[0_24px_48px_-16px_rgba(225,29,72,0.25)] md:h-64 md:w-52">
              <ProductSilhouette tone="after" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wide text-accent-dark">
              {t("afterLabel")}
            </span>
          </div>
        </RevealOnScroll>
      </Container>
    </section>
  );
}
```

- [ ] **Step 2: Add FeaturedProduct to the homepage**

In `src/app/[locale]/page.tsx`, import and render it after `<ProductGrid />`:

```tsx
import { FeaturedProduct } from "@/components/home/FeaturedProduct";
```

```tsx
  return (
    <>
      <Hero />
      <ProductGrid />
      <FeaturedProduct />
    </>
  );
```

- [ ] **Step 3: Verify**

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm dev &
sleep 4
curl -s http://localhost:3000/ | grep -o "Subí una foto de tu producto"
curl -s http://localhost:3000/ | grep -o "bottle-after"
curl -s http://localhost:3000/en | grep -o "Upload a product photo"
kill %1
```
Expected: no type/lint errors; `/` shows the Spanish step copy and the SVG gradient id; `/en` shows the English step copy.

- [ ] **Step 4: Commit**

```bash
git add src/components/home/FeaturedProduct.tsx src/app/[locale]/page.tsx
git commit -m "$(cat <<'EOF'
Add FeaturedProduct before/after showcase for Product Photos

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_016PbVQjaJ6cn8PjBCuJUN5X
EOF
)"
```

---

## Task 9: Content sections — How it works, Free usage, About

**Files:**
- Create: `src/components/home/HowItWorks.tsx`
- Create: `src/components/home/FreeUsage.tsx`
- Create: `src/components/home/About.tsx`
- Modify: `src/app/[locale]/page.tsx` (render the three sections, in this order, after `<FeaturedProduct />`)

**Interfaces:**
- Consumes: `Container`, `SectionHeading`, `RevealOnScroll` from `@/components/ui/*` (Task 2); `howItWorks.*`, `freeUsage.*`, `about.*` message keys (Task 1); `BadgeCheck` from `lucide-react`.
- Produces: `<HowItWorks />` (renders `<section id="how-it-works">`), `<FreeUsage />` (renders `<section id="free-usage">`), `<About />` (renders `<section id="about">`) — all no-props, assembled by Task 10.

- [ ] **Step 1: Create `src/components/home/HowItWorks.tsx`**

```tsx
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";

const STEP_KEYS = ["step1", "step2", "step3", "step4"] as const;

export function HowItWorks() {
  const t = useTranslations("howItWorks");

  return (
    <section id="how-it-works" className="bg-paper py-24 md:py-32">
      <Container className="flex flex-col gap-14">
        <SectionHeading heading={t("heading")} />
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {STEP_KEYS.map((key, index) => (
            <RevealOnScroll key={key} delayMs={index * 80}>
              <div className="flex flex-col gap-3">
                <span className="text-sm font-bold text-accent">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="text-lg font-semibold text-ink">
                  {t(`${key}Title`)}
                </h3>
                <p className="text-sm leading-relaxed text-neutral-500">
                  {t(`${key}Body`)}
                </p>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </Container>
    </section>
  );
}
```

- [ ] **Step 2: Create `src/components/home/FreeUsage.tsx`**

```tsx
import { useTranslations } from "next-intl";
import { BadgeCheck } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";

export function FreeUsage() {
  const t = useTranslations("freeUsage");

  return (
    <section id="free-usage" className="bg-paper-alt py-24 md:py-32">
      <Container>
        <RevealOnScroll className="mx-auto flex max-w-2xl flex-col items-center gap-5 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-accent shadow-sm">
            <BadgeCheck size={22} />
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            {t("heading")}
          </h2>
          <p className="text-lg text-neutral-600">{t("body")}</p>
        </RevealOnScroll>
      </Container>
    </section>
  );
}
```

- [ ] **Step 3: Create `src/components/home/About.tsx`**

```tsx
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";

export function About() {
  const t = useTranslations("about");

  return (
    <section id="about" className="bg-paper py-24 md:py-32">
      <Container>
        <RevealOnScroll className="mx-auto flex max-w-2xl flex-col items-center gap-5 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            {t("heading")}
          </h2>
          <p className="text-lg text-neutral-600">{t("body")}</p>
        </RevealOnScroll>
      </Container>
    </section>
  );
}
```

- [ ] **Step 4: Add the three sections to the homepage**

In `src/app/[locale]/page.tsx`, import and render them in order after `<FeaturedProduct />`:

```tsx
import { HowItWorks } from "@/components/home/HowItWorks";
import { FreeUsage } from "@/components/home/FreeUsage";
import { About } from "@/components/home/About";
```

```tsx
  return (
    <>
      <Hero />
      <ProductGrid />
      <FeaturedProduct />
      <HowItWorks />
      <FreeUsage />
      <About />
    </>
  );
```

- [ ] **Step 5: Verify**

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm dev &
sleep 4
curl -s http://localhost:3000/ | grep -o "Probalo antes de pagar"
curl -s http://localhost:3000/ | grep -o "Sobre Novalup AI"
curl -s http://localhost:3000/en | grep -o "Try before you pay"
kill %1
```
Expected: no type/lint errors; `/` shows the Spanish Free-usage heading and the About heading; `/en` shows the English Free-usage heading.

- [ ] **Step 6: Commit**

```bash
git add src/components/home/HowItWorks.tsx src/components/home/FreeUsage.tsx src/components/home/About.tsx src/app/[locale]/page.tsx
git commit -m "$(cat <<'EOF'
Add How it works, Free usage, and About sections

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_016PbVQjaJ6cn8PjBCuJUN5X
EOF
)"
```

---

## Task 10: FinalCTA and full homepage assembly with metadata

**Files:**
- Create: `src/components/home/FinalCTA.tsx`
- Modify: `src/app/[locale]/page.tsx` (final form: `<Hero /><ProductGrid /><FeaturedProduct /><HowItWorks /><FreeUsage /><About /><FinalCTA />`, plus `generateMetadata`)

**Interfaces:**
- Consumes: `Button`, `Container`, `RevealOnScroll` from `@/components/ui/*` (Task 2); `finalCta.*` message keys (Task 1); `buildAlternates` from `@/lib/seo` (Task 1).
- Produces: `<FinalCTA />` (no props). `src/app/[locale]/page.tsx` reaches its final, complete form — no later task modifies it.

- [ ] **Step 1: Create `src/components/home/FinalCTA.tsx`**

```tsx
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";

export function FinalCTA() {
  const t = useTranslations("finalCta");

  return (
    <section className="bg-ink py-24 md:py-32">
      <Container>
        <RevealOnScroll className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
            {t("heading")}
          </h2>
          <p className="text-lg text-neutral-400">{t("subheading")}</p>
          <Button href="/#products" variant="primary">
            {t("cta")}
          </Button>
        </RevealOnScroll>
      </Container>
    </section>
  );
}
```

- [ ] **Step 2: Finalize `src/app/[locale]/page.tsx`**

Replace the entire file with:

```tsx
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildAlternates } from "@/lib/seo";
import { Hero } from "@/components/home/Hero";
import { ProductGrid } from "@/components/home/ProductGrid";
import { FeaturedProduct } from "@/components/home/FeaturedProduct";
import { HowItWorks } from "@/components/home/HowItWorks";
import { FreeUsage } from "@/components/home/FreeUsage";
import { About } from "@/components/home/About";
import { FinalCTA } from "@/components/home/FinalCTA";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: buildAlternates("/"),
  };
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Hero />
      <ProductGrid />
      <FeaturedProduct />
      <HowItWorks />
      <FreeUsage />
      <About />
      <FinalCTA />
    </>
  );
}
```

- [ ] **Step 3: Verify the complete homepage in both locales**

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm dev &
sleep 4
curl -s http://localhost:3000/ | grep -o "Encontrá una herramienta"
curl -s http://localhost:3000/ | grep -o '<title>[^<]*</title>'
curl -s http://localhost:3000/en | grep -o "Find a tool"
curl -s http://localhost:3000/en | grep -o '<title>[^<]*</title>'
kill %1
```
Expected: no type/lint errors; `/` shows the Spanish FinalCTA heading and a `<title>` containing the Spanish metadata title; `/en` shows the English FinalCTA heading and an English `<title>`.

- [ ] **Step 4: Commit**

```bash
git add src/components/home/FinalCTA.tsx src/app/[locale]/page.tsx
git commit -m "$(cat <<'EOF'
Add FinalCTA and assemble the complete Novalup AI homepage

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_016PbVQjaJ6cn8PjBCuJUN5X
EOF
)"
```

---

## Task 11: PlaceholderPage and the 8 stub routes

**Files:**
- Create: `src/components/ui/PlaceholderPage.tsx`
- Create: `src/app/[locale]/product-photos/page.tsx`
- Create: `src/app/[locale]/cv/page.tsx`
- Create: `src/app/[locale]/study/page.tsx`
- Create: `src/app/[locale]/interview/page.tsx`
- Create: `src/app/[locale]/trading/page.tsx`
- Create: `src/app/[locale]/terms/page.tsx`
- Create: `src/app/[locale]/privacy/page.tsx`
- Create: `src/app/[locale]/contact/page.tsx`

**Interfaces:**
- Consumes: `Button`, `Container` from `@/components/ui/*` (Task 2); `products` from `@/data/products` (Task 5); `buildAlternates` from `@/lib/seo` (Task 1); `placeholder.*`, `legal.*`, `products.items.*` message keys (Task 1).
- Produces: `PlaceholderPage({ name: string; message: string })` — a leaf UI component with no route-specific logic, so every stub route below is a thin wrapper around it.

- [ ] **Step 1: Create `src/components/ui/PlaceholderPage.tsx`**

```tsx
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

export function PlaceholderPage({
  name,
  message,
}: {
  name: string;
  message: string;
}) {
  const t = useTranslations("placeholder");

  return (
    <section className="flex min-h-[60vh] items-center bg-paper py-24">
      <Container className="mx-auto flex max-w-xl flex-col items-center gap-6 text-center">
        <span className="rounded-full bg-paper-alt px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          {t("badge")}
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          {name}
        </h1>
        <p className="text-lg text-neutral-600">{message}</p>
        <Button href="/" variant="primary">
          {t("backHome")}
        </Button>
      </Container>
    </section>
  );
}
```

- [ ] **Step 2: Create `src/app/[locale]/product-photos/page.tsx`**

```tsx
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PlaceholderPage } from "@/components/ui/PlaceholderPage";
import { buildAlternates } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "products" });

  return {
    title: t("items.product-photos.name"),
    alternates: buildAlternates("/product-photos"),
  };
}

export default async function ProductPhotosPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "products" });
  const tp = await getTranslations({ locale, namespace: "placeholder" });

  return (
    <PlaceholderPage
      name={t("items.product-photos.name")}
      message={tp("toolMessage")}
    />
  );
}
```

- [ ] **Step 3: Create `src/app/[locale]/cv/page.tsx`**

```tsx
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PlaceholderPage } from "@/components/ui/PlaceholderPage";
import { buildAlternates } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "products" });

  return {
    title: t("items.cv-analyzer.name"),
    alternates: buildAlternates("/cv"),
  };
}

export default async function CvAnalyzerPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "products" });
  const tp = await getTranslations({ locale, namespace: "placeholder" });

  return (
    <PlaceholderPage
      name={t("items.cv-analyzer.name")}
      message={tp("toolMessage")}
    />
  );
}
```

- [ ] **Step 4: Create `src/app/[locale]/study/page.tsx`**

```tsx
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PlaceholderPage } from "@/components/ui/PlaceholderPage";
import { buildAlternates } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "products" });

  return {
    title: t("items.study-assistant.name"),
    alternates: buildAlternates("/study"),
  };
}

export default async function StudyAssistantPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "products" });
  const tp = await getTranslations({ locale, namespace: "placeholder" });

  return (
    <PlaceholderPage
      name={t("items.study-assistant.name")}
      message={tp("toolMessage")}
    />
  );
}
```

- [ ] **Step 5: Create `src/app/[locale]/interview/page.tsx`**

```tsx
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PlaceholderPage } from "@/components/ui/PlaceholderPage";
import { buildAlternates } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "products" });

  return {
    title: t("items.interview-simulator.name"),
    alternates: buildAlternates("/interview"),
  };
}

export default async function InterviewSimulatorPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "products" });
  const tp = await getTranslations({ locale, namespace: "placeholder" });

  return (
    <PlaceholderPage
      name={t("items.interview-simulator.name")}
      message={tp("toolMessage")}
    />
  );
}
```

- [ ] **Step 6: Create `src/app/[locale]/trading/page.tsx`**

```tsx
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PlaceholderPage } from "@/components/ui/PlaceholderPage";
import { buildAlternates } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "products" });

  return {
    title: t("items.trading-analytics.name"),
    alternates: buildAlternates("/trading"),
  };
}

export default async function TradingAnalyticsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "products" });
  const tp = await getTranslations({ locale, namespace: "placeholder" });

  return (
    <PlaceholderPage
      name={t("items.trading-analytics.name")}
      message={tp("toolMessage")}
    />
  );
}
```

- [ ] **Step 7: Create `src/app/[locale]/terms/page.tsx`**

```tsx
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PlaceholderPage } from "@/components/ui/PlaceholderPage";
import { buildAlternates } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal" });

  return {
    title: t("terms.name"),
    alternates: buildAlternates("/terms"),
  };
}

export default async function TermsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "legal" });

  return <PlaceholderPage name={t("terms.name")} message={t("terms.message")} />;
}
```

- [ ] **Step 8: Create `src/app/[locale]/privacy/page.tsx`**

```tsx
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PlaceholderPage } from "@/components/ui/PlaceholderPage";
import { buildAlternates } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal" });

  return {
    title: t("privacy.name"),
    alternates: buildAlternates("/privacy"),
  };
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "legal" });

  return (
    <PlaceholderPage name={t("privacy.name")} message={t("privacy.message")} />
  );
}
```

- [ ] **Step 9: Create `src/app/[locale]/contact/page.tsx`**

```tsx
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PlaceholderPage } from "@/components/ui/PlaceholderPage";
import { buildAlternates } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal" });

  return {
    title: t("contact.name"),
    alternates: buildAlternates("/contact"),
  };
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "legal" });

  return (
    <PlaceholderPage name={t("contact.name")} message={t("contact.message")} />
  );
}
```

- [ ] **Step 10: Verify every route resolves in both locales**

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm dev &
sleep 4
for path in product-photos cv study interview trading terms privacy contact; do
  echo "es /$path:"; curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/$path
  echo "en /$path:"; curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/en/$path
done
curl -s http://localhost:3000/product-photos | grep -o "Fotos de Producto con IA"
curl -s http://localhost:3000/en/terms | grep -o "Terms & conditions"
kill %1
```
Expected: no type/lint errors; every path prints HTTP `200` for both locales; the Spanish `/product-photos` page contains the Spanish product name; the English `/en/terms` page contains the English terms title.

- [ ] **Step 11: Commit**

```bash
git add src/components/ui/PlaceholderPage.tsx "src/app/[locale]/product-photos" "src/app/[locale]/cv" "src/app/[locale]/study" "src/app/[locale]/interview" "src/app/[locale]/trading" "src/app/[locale]/terms" "src/app/[locale]/privacy" "src/app/[locale]/contact"
git commit -m "$(cat <<'EOF'
Add placeholder routes for all 5 tools and 3 legal pages

Each route shares one PlaceholderPage component so no nav/footer link
404s while the real tool platforms and legal content are built later.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_016PbVQjaJ6cn8PjBCuJUN5X
EOF
)"
```

---

## Task 12: Global SEO assets — favicon, OG image, sitemap, robots

**Files:**
- Create: `src/app/icon.svg`
- Create: `src/app/opengraph-image.tsx`
- Create: `src/app/sitemap.ts`
- Create: `src/app/robots.ts`

**Interfaces:**
- Consumes: none (static route-convention files at the `app/` root, outside `[locale]`, so Next.js applies them to every locale route by inheritance).
- Produces: nothing consumed by other tasks — this is the last content task before final verification.

- [ ] **Step 1: Create `src/app/icon.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="16" fill="#0B0B0D" />
  <path d="M20 44V20h5.2l13.6 17.4V20H44v24h-5.2L25.2 26.6V44H20z" fill="#e11d48" />
</svg>
```

- [ ] **Step 2: Create `src/app/opengraph-image.tsx`**

```tsx
import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          backgroundColor: "#0B0B0D",
        }}
      >
        <div style={{ display: "flex", fontSize: 96, fontWeight: 800, letterSpacing: -2 }}>
          <span style={{ color: "#ffffff" }}>Novalup</span>
          <span style={{ color: "#e11d48" }}>AI</span>
        </div>
        <div style={{ display: "flex", fontSize: 32, color: "#a3a3a3" }}>
          AI tools that actually do something.
        </div>
      </div>
    ),
    { ...size }
  );
}
```

- [ ] **Step 3: Create `src/app/robots.ts`**

```ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://novalup.ai/sitemap.xml",
  };
}
```

- [ ] **Step 4: Create `src/app/sitemap.ts`**

```ts
import type { MetadataRoute } from "next";

const PATHS = [
  "/",
  "/product-photos",
  "/cv",
  "/study",
  "/interview",
  "/trading",
  "/terms",
  "/privacy",
  "/contact",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://novalup.ai";

  return PATHS.map((path) => {
    const suffix = path === "/" ? "" : path;
    return {
      url: `${baseUrl}${suffix || "/"}`,
      alternates: {
        languages: {
          es: `${baseUrl}${suffix || "/"}`,
          en: `${baseUrl}/en${suffix}`,
        },
      },
    };
  });
}
```

- [ ] **Step 5: Verify**

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm build
pnpm dev &
sleep 4
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/icon.svg
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/opengraph-image
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/sitemap.xml
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/robots.txt
kill %1
```
Expected: `pnpm build` completes with no errors (this also proves every route in Tasks 1-11 builds cleanly for production); all four asset URLs return `200`.

- [ ] **Step 6: Commit**

```bash
git add src/app/icon.svg src/app/opengraph-image.tsx src/app/sitemap.ts src/app/robots.ts
git commit -m "$(cat <<'EOF'
Add favicon, OG image, sitemap, and robots.txt

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_016PbVQjaJ6cn8PjBCuJUN5X
EOF
)"
```

---

## Task 13: Full-site verification pass

**Files:**
- Modify: any file from Tasks 1-12, only if this pass finds a defect to fix.

**Interfaces:**
- Consumes: the entire site built in Tasks 1-12.
- Produces: nothing new — this task is a checklist, not a feature.

- [ ] **Step 1: Type-check, lint, and production build**

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```
Expected: all three pass with zero errors/warnings that fail the build.

- [ ] **Step 2: Link-check every nav/footer/product destination in both locales**

```bash
pnpm dev &
sleep 4
for path in "" "#products" "#how-it-works" "#about" "#free-usage" product-photos cv study interview trading terms privacy contact; do
  clean_path=$(echo "$path" | sed 's/#.*//')
  echo "es /$clean_path:"; curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3000/$clean_path"
  echo "en /$clean_path:"; curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3000/en/$clean_path"
done
kill %1
```
Expected: every path returns `200` for both `es` and `en`. If anything 404s, fix the offending `href` or missing route file before continuing.

- [ ] **Step 3: Responsive check at 375px, 768px, and 1440px**

Run `pnpm dev`, open `http://localhost:3000` in a browser (or via `playwright-cli` if available), and resize/emulate each width for both `/` and `/en`. Confirm at each width:
- The navbar collapses to the hamburger menu below `md` (768px) and the mobile menu opens/closes correctly.
- The Hero headline and CTAs never overflow or get clipped; the floating mockup cluster shows the condensed 2-card mobile version below `lg` (1024px) and the full 5-card floating layout at `lg`+.
- The product grid is 1 column on mobile, 2 on tablet, 3 on desktop.
- The FeaturedProduct before/after panels stack usably (image stack above copy) on mobile per the `order-1`/`order-2` classes.
- No horizontal scrollbar appears at any width.

Fix any overflow/clipping/broken-collapse issue found, re-run this step until clean.

- [ ] **Step 4: Accessibility and reduced-motion spot check**

- Confirm every interactive element (nav links, buttons, hamburger, locale toggle) is reachable via `Tab` and shows a visible focus state (Tailwind's default focus ring is sufficient — if any custom component suppressed it, restore it).
- In devtools, enable "prefers-reduced-motion: reduce" and reload `/`; confirm all `RevealOnScroll` content is immediately visible (no permanently-hidden `opacity-0` content) and the hero mockup cards are not animating.
- Confirm there is exactly one `<h1>` per page (`grep -c "<h1" ` on the raw HTML of `/` should print `1`).

- [ ] **Step 5: Final full-suite verification and commit**

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm build
git status
```
Expected: clean type-check/lint/build; `git status` shows only files touched by fixes made in Steps 2-4 (or nothing, if no defects were found).

If any files changed:
```bash
git add -A
git commit -m "$(cat <<'EOF'
Fix responsive/accessibility issues found in full-site verification pass

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_016PbVQjaJ6cn8PjBCuJUN5X
EOF
)"
```
If nothing changed, no commit is needed — the plan is complete.

