import Image from "next/image";
import copy from "@/content/copy";

const badgeClass =
  "absolute bottom-3 rounded-full bg-night/80 px-3 py-1 text-sm font-medium text-white shadow-lg backdrop-blur-sm";

/**
 * Looping before/after reveal: the generated result is wiped in over the
 * original while a divider rides the boundary, so the landing demonstrates what
 * the product does before the visitor reads a word.
 *
 * Both layers are stacked in one fixed-aspect box. The frame is 3:2 — the
 * native ratio of before.jpg, so it is not cropped, while the square after.jpg
 * is centre-cropped top and bottom, which enlarges the product enough to
 * roughly match the closer framing of the "before" shot.
 */
export function BeforeAfter() {
  return (
    <figure className="relative mx-auto aspect-[3/2] w-full max-w-2xl overflow-hidden rounded-2xl border border-white/[0.08]">
      {/* Both layers are eager: the figure peeks above the fold and the wipe
          starts on load, so a lazily-loaded layer would be swept in blank. */}
      <Image
        src="/images/demo/before.jpg"
        alt={copy.landing.demoBefore}
        fill
        priority
        sizes="(max-width: 768px) 100vw, 672px"
        className="object-cover"
      />
      {/* Sits on the right so it stays readable until the wipe reaches it. */}
      <figcaption className={`${badgeClass} right-3`}>{copy.landing.demoBefore}</figcaption>

      <div className="animate-ba-reveal absolute inset-0">
        <Image
          src="/images/demo/after.jpg"
          alt={copy.landing.demoAfter}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 672px"
          className="object-cover"
        />
        {/* Clipped with its layer, so it appears as the wipe uncovers it. */}
        <span className={`${badgeClass} left-3`}>{copy.landing.demoAfter}</span>
      </div>

      <div className="animate-ba-divider absolute inset-y-0 left-0 w-0.5 -translate-x-1/2 bg-white/80 shadow-[0_0_12px_rgba(255,255,255,0.55)]" />
    </figure>
  );
}
