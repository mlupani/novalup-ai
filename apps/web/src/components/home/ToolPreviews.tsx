import Image from "next/image";
import {
  ArrowRight,
  Camera,
  FileText,
  GraduationCap,
  LineChart,
  Mic,
  Sparkles,
  Star,
  type LucideIcon,
} from "lucide-react";

/**
 * Small, refined slices of product UI. They are decorative on purpose —
 * every preview is rendered inside an aria-hidden wrapper, so images carry
 * empty alt text and the surrounding copy does the talking.
 */

const BEFORE_SRC = "/images/featured-product/before.jpg";
const AFTER_SRC = "/images/featured-product/after.jpg";

function PreviewShell({
  icon: Icon,
  label,
  children,
  className = "",
  stretch = false,
}: {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
  className?: string;
  /** Fill the parent's height instead of sizing from content. */
  stretch?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-white/[0.08] bg-night-card p-3.5 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.95)] ${
        stretch ? "flex h-full flex-col" : ""
      } ${className}`}
    >
      {/* Glass top edge: the detail that keeps flat dark cards from looking flat. */}
      <span
        aria-hidden="true"
        className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
      />
      <div className="mb-3 flex items-center gap-2">
        <Icon size={13} className="text-accent-light" strokeWidth={2} />
        <span className="text-[11px] font-medium tracking-wide text-neutral-400">
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}

export function ProductPhotosPreview({
  className = "",
  stretch = false,
}: {
  className?: string;
  stretch?: boolean;
}) {
  const thumb = stretch ? "h-full min-h-[7rem]" : "aspect-square";

  return (
    <PreviewShell
      icon={Camera}
      label="Product Photos"
      className={className}
      stretch={stretch}
    >
      <div className={`flex items-stretch gap-2 ${stretch ? "flex-1" : ""}`}>
        <div
          className={`relative flex-1 overflow-hidden rounded-lg border border-white/[0.06] ${thumb}`}
        >
          <Image
            src={BEFORE_SRC}
            alt=""
            fill
            sizes="200px"
            className="object-cover opacity-60"
          />
        </div>
        <ArrowRight size={12} className="shrink-0 self-center text-neutral-600" />
        <div
          className={`relative flex-1 overflow-hidden rounded-lg border border-accent/25 bg-white ${thumb}`}
        >
          <Image
            src={AFTER_SRC}
            alt=""
            fill
            sizes="200px"
            className="object-contain"
          />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1.5">
        <Sparkles size={10} className="text-accent-light" />
        <span className="text-[10px] font-medium text-neutral-400">
          AI Generated
        </span>
      </div>
    </PreviewShell>
  );
}

const CV_ROWS = [
  { label: "Experience", width: "w-full" },
  { label: "Skills", width: "w-4/5" },
  { label: "ATS", width: "w-2/3" },
];

export function CvScorePreview({ className = "" }: { className?: string }) {
  return (
    <PreviewShell icon={FileText} label="CV Score" className={className}>
      <div className="text-2xl font-bold leading-none text-white">
        82
        <span className="text-sm font-medium text-neutral-400">/100</span>
      </div>
      <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-white/[0.08]">
        <div className="h-full w-[82%] rounded-full bg-accent" />
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {CV_ROWS.map((row) => (
          <div key={row.label} className="flex items-center gap-2">
            <span className="w-[62px] shrink-0 text-[10px] text-neutral-400">
              {row.label}
            </span>
            <span className="h-1 flex-1 rounded-full bg-white/[0.06]">
              <span
                className={`block h-full rounded-full bg-accent/50 ${row.width}`}
              />
            </span>
          </div>
        ))}
      </div>
    </PreviewShell>
  );
}

export function InterviewPreview({ className = "" }: { className?: string }) {
  return (
    <PreviewShell icon={Mic} label="Interview" className={className}>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={12}
            className={
              star <= 4 ? "fill-accent text-accent" : "text-neutral-700"
            }
          />
        ))}
        <span className="ml-1.5 text-[11px] font-semibold text-white">4.0</span>
      </div>
      <div className="mt-3 rounded-lg border border-white/[0.05] bg-white/[0.03] p-2.5">
        <span className="text-[10px] text-neutral-400">Feedback</span>
        <span className="mt-1.5 block h-1 w-full rounded-full bg-white/[0.09]" />
        <span className="mt-1.5 block h-1 w-2/3 rounded-full bg-white/[0.06]" />
      </div>
    </PreviewShell>
  );
}

export function AnalyticsPreview({ className = "" }: { className?: string }) {
  return (
    <PreviewShell icon={LineChart} label="Analytics" className={className}>
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-bold leading-none text-white">+12.4%</span>
        <span className="text-[10px] text-neutral-400">30d</span>
      </div>
      <svg
        viewBox="0 0 100 32"
        preserveAspectRatio="none"
        className="mt-2.5 h-10 w-full"
      >
        <path
          d="M0,26 L14,19 L28,22 L42,11 L56,15 L72,6 L100,9 L100,32 L0,32 Z"
          fill="rgba(225,29,72,0.12)"
        />
        <polyline
          points="0,26 14,19 28,22 42,11 56,15 72,6 100,9"
          fill="none"
          stroke="#e11d48"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </PreviewShell>
  );
}

export function StudyPreview({ className = "" }: { className?: string }) {
  return (
    <PreviewShell icon={GraduationCap} label="Study" className={className}>
      <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-2.5">
        {/* Kept in English like the other in-product labels above. */}
        <span className="text-[10px] font-semibold text-white">
          What is an LLM?
        </span>
        <span className="mt-2 block h-1 w-2/3 rounded-full bg-white/[0.12]" />
        <span className="mt-1.5 block h-1 w-1/2 rounded-full bg-white/[0.07]" />
      </div>
      <div className="mt-2.5 flex items-center justify-between">
        <span className="text-[10px] text-neutral-400">Flashcard 3/12</span>
        <span className="flex gap-1">
          {[0, 1, 2].map((dot) => (
            <span
              key={dot}
              className={`h-1 w-1 rounded-full ${
                dot === 0 ? "bg-accent" : "bg-white/20"
              }`}
            />
          ))}
        </span>
      </div>
    </PreviewShell>
  );
}

/** Preview component for each product slug, used by the tool cards. */
export const TOOL_PREVIEWS: Record<
  string,
  (props: { className?: string; stretch?: boolean }) => React.JSX.Element
> = {
  "product-photos": ProductPhotosPreview,
  "cv-analyzer": CvScorePreview,
  "study-assistant": StudyPreview,
  "interview-simulator": InterviewPreview,
  "trading-analytics": AnalyticsPreview,
};
