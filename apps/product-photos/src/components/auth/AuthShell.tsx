import Link from "next/link";
import { HeroBackground } from "@/components/ui/HeroBackground";
import copy from "@/content/copy";

/**
 * Shared frame for /login and /signup so they read as the same site as the
 * landing: the drifting backdrop, the brand, and a card solid enough to stay
 * legible over the artwork.
 */
export function AuthShell({
  title, children, footer,
}: {
  title: string;
  children: React.ReactNode;
  footer: { text: string; href: string; linkLabel: string };
}) {
  return (
    <main className="relative flex min-h-screen flex-col">
      <HeroBackground />

      <header className="relative mx-auto w-full max-w-5xl px-6 py-6">
        <Link href="/" className="text-lg font-bold tracking-tight">
          {copy.brand.name} <span className="text-accent-light">{copy.brand.product}</span>
        </Link>
      </header>

      <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-6 py-12">
        <h1 className="text-center text-2xl font-bold drop-shadow-lg">{title}</h1>
        <div className="flex flex-col gap-5 rounded-2xl border border-white/10 bg-night-card/95 p-6 shadow-2xl backdrop-blur-xl">
          {children}
        </div>
        <p className="text-center text-sm text-neutral-300 drop-shadow">
          {footer.text}{" "}
          <Link href={footer.href} className="text-accent-light hover:underline">{footer.linkLabel}</Link>
        </p>
      </div>
    </main>
  );
}
