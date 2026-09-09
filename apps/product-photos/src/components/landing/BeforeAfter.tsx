import Image from "next/image";
import copy from "@/content/copy";

const badgeClass =
  "absolute bottom-3 rounded-full bg-night/80 px-3 py-1 text-sm font-medium text-white shadow-lg backdrop-blur-sm";

/**
 * The demo pairs shown on the landing. The pairs do not share a native aspect
 * ratio, so every frame is a fixed 4:5 and both layers are centre-cropped to
 * fill it. The first pair drives LCP and loads with priority.
 */
const pairs = [
  { before: "/images/demo/before_1.webp", after: "/images/demo/after_1.png" },
  { before: "/images/demo/before_2.webp", after: "/images/demo/after_2.png" },
  { before: "/images/demo/before_3.jpg", after: "/images/demo/after_3.png" },
];

/**
 * Looping before/after reveals: the generated result is wiped in over the
 * original while a divider rides the boundary, so the landing demonstrates what
 * the product does before the visitor reads a word.
 *
 * Stacked on mobile, three columns from `md`. All three wipes share the one
 * looping keyframe, so the columns reveal in sync.
 */
export function BeforeAfterGrid() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {pairs.map((pair, index) => (
        <BeforeAfter key={pair.after} before={pair.before} after={pair.after} index={index} />
      ))}
    </div>
  );
}

function BeforeAfter({ before, after, index }: { before: string; after: string; index: number }) {
  // The first pair sits highest and drives LCP, so it gets `priority`. The rest
  // still load eagerly — a lazily-loaded layer would be swept in blank by the
  // wipe — but without the high fetch-priority hint.
  const loading = index === 0 ? { priority: true } : { loading: "eager" as const };
  const sizes = "(max-width: 768px) 100vw, 340px";

  return (
    <figure className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-white/[0.08]">
      <Image src={before} alt={copy.landing.demoBefore} fill sizes={sizes} className="object-cover object-center" {...loading} />
      {/* Sits on the right so it stays readable until the wipe reaches it. */}
      <figcaption className={`${badgeClass} right-3`}>{copy.landing.demoBefore}</figcaption>

      <div className="animate-ba-reveal absolute inset-0">
        <Image src={after} alt={copy.landing.demoAfter} fill sizes={sizes} className="object-cover object-center" {...loading} />
        {/* Clipped with its layer, so it appears as the wipe uncovers it. */}
        <span className={`${badgeClass} left-3`}>{copy.landing.demoAfter}</span>
      </div>

      <div className="animate-ba-divider absolute inset-y-0 left-0 w-0.5 -translate-x-1/2 bg-white/80 shadow-[0_0_12px_rgba(255,255,255,0.55)]" />
    </figure>
  );
}
