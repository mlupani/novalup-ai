# Novalup AI — Homepage & Product Hub Design Spec

Date: 2026-09-04
Status: Approved by user, pending written-spec review

## 1. Purpose & scope

Build the base website for **Novalup AI**, a product hub that will host a
growing collection of consumer-facing AI tools (Product Photos, CV
Analyzer, Study Assistant, Interview Simulator, Trading Analytics). The
homepage's only job is to get a visitor (mostly arriving from TikTok,
Instagram, or Google) to understand what Novalup AI is, see what tools
exist, and try one within seconds.

**In scope:** the marketing homepage, shared layout (navbar/footer),
routing skeleton for every tool, Spanish/English i18n, SEO metadata.

**Explicitly out of scope:** building any tool's actual functionality.
`/product-photos` is *not* a marketing landing page — it is a placeholder
for the real product platform (with auth, credits, payments) that will be
built and published in a separate, already-planned effort at the same
time as this homepage. All five tool routes get the same minimal
placeholder treatment for now.

Brand context: Novalup AI is a sibling brand to Novalup Desarrollos
(the existing dark/red software-agency site at `web/`). Visual identity
(color tokens, font, button/card language) is inherited and evolved, but
none of the agency messaging ("12 years experience", "enterprise
solutions") belongs here.

## 2. Stack & project setup

- **Next.js (App Router) + TypeScript + Tailwind CSS v3.4 + pnpm** —
  matches the convention already used in the sibling `misproductos`
  project (same ecosystem, same tooling expectations).
- **`next-intl`** for i18n — the standard App Router i18n library. Used
  for locale routing, the language switcher, and localized SEO alternates
  (hreflang). This is the one new dependency beyond the framework itself.
- **`lucide-react`** for icons — a clean single-weight line icon set,
  tree-shakeable, fits a premium/minimal AI-product aesthetic better than
  the mixed-style `react-icons` used elsewhere.
- **No animation library.** Microinteractions (fade-in-up on scroll,
  hover states) are done with Tailwind transitions/keyframes plus one
  small custom `useInView` hook built on `IntersectionObserver`. No
  Framer Motion — keeps the bundle light and matches "performance over
  effects."
- **Font:** Inter via `next/font/google` (already the brand's font).
- **Package scripts:** `dev`, `build`, `start`, `lint` (via
  `eslint-config-next`), `typecheck` (`tsc --noEmit`).

## 3. Design system

### Color tokens (Tailwind theme extension)

| Token | Value | Use |
|---|---|---|
| `ink` | `#0B0B0D` | Hero & final-CTA background (near-black) |
| `night` | `#111111` | Secondary dark surface |
| `night-card` | `#18181B` | Cards inside dark sections |
| `paper` | `#FAFAFA` | Default light section background |
| `paper-alt` | `#F3F3F5` | Alternate band to separate light sections without a hard edge |
| `accent` | `#e11d48` | Primary accent (CTAs, badges, highlights) |
| `accent-dark` | `#be123c` | Gradient end / hover state |
| `accent-light` | `#fb7185` | Subtle highlights, "available" badge tint |
| Gray scale | Tailwind neutral 100–900 | Body text, borders, muted UI |

The accent is used sparingly — on buttons, status badges, small
highlights, and the hero/final-CTA gradient — never as a dominant fill
across a whole light section.

### Layout rhythm

Light sections (Products, Featured Product, How it works, Free usage,
About) alternate between `paper` and `paper-alt` backgrounds so sections
read as distinct without borders. Hero and Final CTA are `ink` — the two
dramatic, brand-colored bookends. Generous vertical rhythm
(`py-24 md:py-32`), `max-w-7xl` containers, wide gutters.

### Typography

- Hero H1: `text-5xl` mobile → `text-7xl`/`text-8xl` desktop, weight
  700–800, tight tracking.
- Section H2: `text-3xl` → `text-5xl`, semibold.
- Body: `text-base`/`text-lg`, relaxed line-height, gray-500/600 on
  light, gray-400 on dark.
- One H1 per page (in the hero); every other section title is an H2.

### Components

- **Buttons:** pill (`rounded-full`). Primary = accent gradient + white
  text + soft shadow + subtle lift on hover. Secondary = 1px outline
  pill, transparent background. Tertiary = text link, underline on
  hover. All touch targets ≥44px tall for mobile.
- **Cards:** `rounded-2xl`, hairline border, very soft shadow, slightly
  stronger shadow + 2–4px lift on hover. No glassmorphism, no glow.
- **Status badge** on product cards: small pill, `accent-light` tint for
  "Available", neutral gray tint for "Coming soon".

### Motion

Sections and cards fade-in + slide-up (8–12px) the first time they enter
the viewport, via the shared `useInView` hook — one-shot, not
scroll-linked, respects `prefers-reduced-motion`. Hover states are plain
CSS transitions (150–200ms). No parallax, no scroll-jacking.

## 4. Internationalization

- **Locales:** `es` (default) and `en`.
- **URL strategy:** `as-needed` prefix — Spanish is unprefixed
  (`novalup.ai/`, `novalup.ai/product-photos`), English is prefixed
  (`novalup.ai/en`, `novalup.ai/en/product-photos`).
- **No automatic browser-language redirect.** `localeDetection: false` in
  the `next-intl` middleware — every visitor lands on Spanish by default
  regardless of browser `Accept-Language`; switching to English is only
  ever an explicit user action via the selector. This matches "default
  is Spanish" literally.
- **Language selector:** a small "ES / EN" toggle in the navbar (and in
  the mobile menu), using `next-intl`'s generated `Link`/`usePathname` so
  it swaps locale while preserving the current path. No flags, no
  dropdown with extra options — just the two-way toggle.
- **Structure:**
  ```
  src/
    middleware.ts              # next-intl middleware (locales, defaultLocale: es, localePrefix: as-needed, localeDetection: false)
    i18n/
      routing.ts                # defineRouting({ locales, defaultLocale, localePrefix })
      navigation.ts             # localized Link, useRouter, usePathname
      request.ts                # getRequestConfig — loads messages per locale
    messages/
      es.json
      en.json
    app/
      [locale]/
        layout.tsx               # html/body root, loads messages, sets <html lang>
        page.tsx                 # homepage
        product-photos/page.tsx
        cv/page.tsx
        study/page.tsx
        interview/page.tsx
        trading/page.tsx
        terms/page.tsx
        privacy/page.tsx
        contact/page.tsx
  ```
- **Translated copy** lives in `messages/{locale}.json`, namespaced by
  section (`nav`, `hero`, `products`, `howItWorks`, `freeUsage`, `about`,
  `finalCta`, `footer`). Product copy (name/description/CTA label) is
  namespaced by slug: `products.items.<slug>.name` /
  `.description` / `.cta`. Structural product data (slug, status, href,
  icon, category, featured) stays in `src/data/products.ts` and is not
  duplicated per locale — components look up the matching translation by
  slug at render time via `useTranslations`.
- **SEO:** each `[locale]/*/page.tsx` exports `generateMetadata` with
  localized title/description and `alternates.languages` hreflang
  entries pointing at the equivalent URL in the other locale.

## 5. Data model

```ts
// src/data/products.ts
export type ProductStatus = "available" | "coming-soon";

export interface Product {
  slug: string;                 // "product-photos"
  href: string;                 // "/product-photos" (locale-relative, via localized Link)
  status: ProductStatus;
  icon: LucideIcon;
  category: string;             // e.g. "creative", "career", "learning", "finance"
  featured?: boolean;           // true only for product-photos initially
}

export const products: Product[] = [
  { slug: "product-photos", href: "/product-photos", status: "available", icon: ImageIcon, category: "creative", featured: true },
  { slug: "cv-analyzer",    href: "/cv",              status: "coming-soon", icon: FileTextIcon, category: "career" },
  { slug: "study-assistant",href: "/study",           status: "coming-soon", icon: GraduationCapIcon, category: "learning" },
  { slug: "interview-simulator", href: "/interview",  status: "coming-soon", icon: MicIcon, category: "career" },
  { slug: "trading-analytics",   href: "/trading",    status: "coming-soon", icon: LineChartIcon, category: "finance" },
];
```

Adding a new tool later = one object in this array + one translation
block per locale + (optionally) a route folder. `ProductGrid` maps over
`products`; `ProductCard` reads status to decide badge/button style —
"coming-soon" cards are still clickable, linking to that tool's
placeholder page rather than being dead/disabled (better for SEO and for
signaling "this is real, just not launched yet").

## 6. Page structure (homepage)

1. **Navbar** — wordmark "Novalup AI" (text-based: "Novalup" in ink +
   "AI" in accent, no wolf mark), nav links (Products, How it works,
   About — anchor links to homepage sections), "Try a tool" CTA, ES/EN
   toggle, hamburger menu on mobile.
2. **Hero** (`ink` background) — H1 "AI tools that actually do
   something.", subheadline, two CTAs ("Explore tools" primary, "Try for
   free" secondary), and a hero visual made of small floating
   "product-window" mockups (CV score, before/after thumbnail, flashcard,
   interview score, analytics chart) built with CSS/SVG shapes — no stock
   imagery.
3. **Products** — heading + subheading, responsive grid of `ProductCard`
   from `products.ts` (1 col mobile → 2 → 3 desktop).
4. **Featured Product** — Product Photos before/after as the visual
   centerpiece, 3-line explanation (upload → choose style → generate),
   "Try it free" CTA linking to `/product-photos`.
5. **How it works** — 4 numbered steps (Choose a tool → Upload or
   describe → Get your result → Keep creating), no technical detail.
6. **Free usage** — "Try before you pay" message, one short paragraph,
   no pricing table.
7. **About** — one short paragraph, no agency/enterprise language.
8. **Final CTA** (`ink` background) — bold statement + "Explore tools"
   button.
9. **Footer** — wordmark, link columns (Products, About, Terms, Privacy,
   Contact), "Part of Novalup" line connecting to the parent brand.

## 7. Component architecture

```
src/
  components/
    layout/Navbar.tsx
    layout/MobileMenu.tsx
    layout/LocaleToggle.tsx
    layout/Footer.tsx
    home/Hero.tsx
    home/HeroMockups.tsx
    home/ProductGrid.tsx
    home/ProductCard.tsx
    home/FeaturedProduct.tsx
    home/HowItWorks.tsx
    home/FreeUsage.tsx
    home/About.tsx
    home/FinalCTA.tsx
    ui/Button.tsx
    ui/Container.tsx
    ui/SectionHeading.tsx
    ui/RevealOnScroll.tsx        # wraps useInView fade/slide-up
    ui/PlaceholderPage.tsx        # shared stub for tool + legal routes
  data/
    products.ts
  lib/
    constants.ts                 # site name, nav items, social/footer links
  hooks/
    useInView.ts
```

Each tool route (`product-photos`, `cv`, `study`, `interview`,
`trading`) and each legal route (`terms`, `privacy`, `contact`) renders
`<PlaceholderPage />` with a name/message prop — a minimal on-brand page
(headline, one line of copy, link back home), not a real page, so no
route ever 404s.

## 8. SEO & metadata

- Title: "Novalup AI — AI Tools That Actually Do Something" (localized
  variant for `en`; Spanish equivalent for `es`).
- Description: "Practical AI tools for work, creativity, learning and
  everyday tasks." (localized).
- OpenGraph + Twitter card metadata, shared OG image (visual identity,
  not per-locale for now).
- Favicon: a small geometric monogram in the accent red (not the wolf) —
  final art decided at implementation time.
- `alternates.languages` hreflang per page pointing at the other
  locale's equivalent URL.
- Semantic HTML: one `<h1>` (hero), `<h2>` per section, real `<a>`/`next/link`
  for all navigation.

## 9. Testing / verification approach

This is a static marketing site — no unit test framework is being added.
Verification is:
- `tsc --noEmit` and `next lint` clean.
- Manual responsive QA in the dev server at mobile (375px), tablet, and
  desktop widths, for both locales.
- Manual check that every nav/footer/product link resolves (no 404s)
  across both locales.
- Basic Lighthouse pass (performance/SEO/accessibility) given the
  "fast and lightweight" requirement.

## 10. Explicitly deferred

- Any real tool functionality (Product Photos generation engine, auth,
  payments/credits) — separate, already-planned effort.
- Pricing page.
- Real content for Terms/Privacy/Contact (placeholder only).
- CMS or headless content source — product data is static in-repo for now.
