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
          <a href="/login" className="text-neutral-300 hover:text-white transition-colors duration-150">{copy.landing.login}</a>
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
