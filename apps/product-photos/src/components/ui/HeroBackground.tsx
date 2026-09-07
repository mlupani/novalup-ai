import Image from "next/image";

/**
 * Full-bleed animated backdrop shared by the landing and the auth pages.
 * Absolutely positioned — the parent must be `relative`.
 *
 * The artwork is bright and busy, so it is darkened hard and faded toward the
 * page background at the bottom; without that the copy on top is unreadable.
 */
export function HeroBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <Image
        src="/images/fondo.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="animate-hero-drift object-cover"
      />
      <div className="absolute inset-0 bg-night/75" />
      <div className="absolute inset-0 bg-gradient-to-b from-night/80 via-night/40 to-night" />
    </div>
  );
}
