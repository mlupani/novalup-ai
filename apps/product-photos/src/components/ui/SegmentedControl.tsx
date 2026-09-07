"use client";

import { cn } from "@/lib/cn";

export function SegmentedControl<T extends string>({
  options, value, onChange, ariaLabel,
}: {
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T | null;
  onChange: (v: T) => void;
  ariaLabel: string;
}) {
  return (
    <div role="group" aria-label={ariaLabel} className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-full border px-4 py-2 text-sm transition-colors min-h-[44px]",
            value === o.value
              ? "border-accent bg-accent/15 text-white"
              : "border-white/12 text-neutral-300 hover:border-white/25 hover:text-white",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
