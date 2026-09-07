import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { HeroBackground } from "@/components/ui/HeroBackground";
import { BeforeAfter } from "@/components/landing/BeforeAfter";
import { FREE_CREDITS } from "@/lib/credits/config";
import copy from "@/content/copy";

export function LandingHero() {
  return (
    <main className="flex flex-col">
      {/* Deliberately short of a full viewport so the before/after proof below
          peeks above the fold instead of hiding until the visitor scrolls. */}
      <section className="relative flex min-h-[72vh] flex-col">
        <HeroBackground />

        <header className="relative mx-auto w-full max-w-5xl px-6 py-6">
          <Link href="/" className="text-lg font-bold tracking-tight">
            {copy.brand.name} <span className="text-accent-light">{copy.brand.product}</span>
          </Link>
        </header>

        <div className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-6 px-6 py-10 text-center">
          <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight drop-shadow-lg md:text-6xl">
            {copy.landing.headline}
          </h1>
          <p className="max-w-xl text-lg text-neutral-300 drop-shadow-md">{copy.landing.subheadline}</p>
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <Button href="/signup" size="lg">{copy.landing.ctaFree(FREE_CREDITS)}</Button>
            <Button href="/login" size="lg" variant="outline">{copy.landing.login}</Button>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 pb-20 pt-2">
        <BeforeAfter />
      </section>
    </main>
  );
}
