import {
  AnalyticsPreview,
  CvScorePreview,
  InterviewPreview,
  ProductPhotosPreview,
  StudyPreview,
} from "@/components/home/ToolPreviews";

/**
 * The rotation lives on the wrapper and the float animation on the inner
 * element: both write to `transform`, so keeping them on separate nodes
 * stops the keyframe from cancelling the tilt.
 */
function Floating({
  delay,
  className = "",
  children,
}: {
  delay: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <div className="animate-float" style={{ animationDelay: delay }}>
        {children}
      </div>
    </div>
  );
}

/**
 * Text-free stand-in used for the cards that bleed off the phone screen.
 * Real previews there would only render micro-copy nobody can read.
 */
function GhostCard() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-night-card p-3.5 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.95)]">
      <span className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <span className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-accent/50" />
        <span className="h-1.5 w-16 rounded-full bg-white/[0.10]" />
      </span>
      <span className="mt-4 block h-1.5 w-full rounded-full bg-white/[0.07]" />
      <span className="mt-2 block h-1.5 w-3/4 rounded-full bg-white/[0.05]" />
      <span className="mt-5 block h-9 w-full rounded-lg bg-white/[0.04]" />
    </div>
  );
}

export function HeroConstellation() {
  return (
    <div aria-hidden="true">
      {/* Desktop: full five-tool ecosystem. */}
      <div className="relative mx-auto hidden h-[340px] w-full max-w-[64rem] lg:block">
        <Floating delay="0s" className="absolute left-4 top-6 w-52 rotate-[-4deg] opacity-90">
          <CvScorePreview />
        </Floating>
        <Floating
          delay="1.2s"
          className="absolute left-[17%] top-[50%] w-44 rotate-[3deg] opacity-80"
        >
          <InterviewPreview />
        </Floating>
        <Floating
          delay="0.6s"
          className="absolute left-1/2 top-0 z-20 w-[17.5rem] -translate-x-1/2"
        >
          <ProductPhotosPreview className="border-white/[0.16] shadow-[0_30px_80px_-30px_rgba(225,29,72,0.35)]" />
        </Floating>
        <Floating
          delay="1.8s"
          className="absolute right-[17%] top-[52%] w-44 rotate-[-3deg] opacity-80"
        >
          <StudyPreview />
        </Floating>
        <Floating delay="2.4s" className="absolute right-4 top-6 w-52 rotate-[4deg] opacity-90">
          <AnalyticsPreview />
        </Floating>
      </div>

      {/* Tablet: three tools in a shallow arc, no overlap so nothing gets covered. */}
      <div className="hidden items-start justify-center gap-4 md:flex lg:hidden">
        <Floating delay="0s" className="mt-10 w-44 rotate-[-5deg] opacity-90">
          <CvScorePreview />
        </Floating>
        <Floating delay="0.6s" className="w-56">
          <ProductPhotosPreview className="border-white/[0.16] shadow-[0_30px_80px_-30px_rgba(225,29,72,0.35)]" />
        </Floating>
        <Floating delay="1.2s" className="mt-10 w-44 rotate-[5deg] opacity-90">
          <AnalyticsPreview />
        </Floating>
      </div>

      {/* Mobile: one hero preview, two bleeding off the edges for depth. */}
      <div className="relative flex h-[230px] items-start justify-center md:hidden">
        <Floating
          delay="0s"
          className="absolute left-[-22%] top-8 w-40 rotate-[-8deg]"
        >
          <GhostCard />
        </Floating>
        <Floating
          delay="1.2s"
          className="absolute right-[-22%] top-10 w-40 rotate-[8deg]"
        >
          <GhostCard />
        </Floating>
        <Floating delay="0.6s" className="relative z-20 w-52">
          <ProductPhotosPreview className="border-white/[0.16] shadow-[0_30px_80px_-30px_rgba(225,29,72,0.35)]" />
        </Floating>
      </div>
    </div>
  );
}
