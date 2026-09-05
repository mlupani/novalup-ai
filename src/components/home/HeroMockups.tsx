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
