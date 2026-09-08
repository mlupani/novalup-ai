type Props = { className?: string };

export function ComingSoonBadge({ className = "" }: Props) {
  return (
    <div
      className={`inline-flex items-center gap-2.5 rounded-full border border-accent/30 bg-gradient-to-r from-accent/15 via-accent/10 to-accent/15 px-4 py-2 backdrop-blur-sm ${className}`}
    >
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-light opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent" />
      </span>

      <span className="text-sm font-semibold text-accent-light">Próximamente</span>

      <span className="h-3.5 w-px bg-white/20" />

      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-accent-light/80"
        aria-hidden="true"
      >
        <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
        <rect x="2" y="6" width="14" height="12" rx="2" />
      </svg>

      <span className="text-xs text-neutral-300">Reels automáticos con tus fotos</span>
    </div>
  );
}
