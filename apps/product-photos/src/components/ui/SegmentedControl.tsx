"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";

export function SegmentedControl<T extends string>({
  options, value, onChange, ariaLabel,
}: {
  options: ReadonlyArray<{ value: T; label: string; hint?: string }>;
  value: T | null;
  onChange: (v: T) => void;
  ariaLabel: string;
}) {
  const baseId = useId();
  return (
    <div role="group" aria-label={ariaLabel} className="flex flex-wrap gap-2">
      {options.map((o, i) => {
        const tipId = o.hint ? `${baseId}-${i}` : undefined;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={value === o.value}
            aria-describedby={tipId}
            onClick={() => onChange(o.value)}
            className={cn(
              "group relative inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition-colors min-h-[44px]",
              value === o.value
                ? "border-accent bg-accent/15 text-white"
                : "border-white/12 text-neutral-300 hover:border-white/25 hover:text-white",
            )}
          >
            {o.label}
            {o.hint && (
              <>
                <span
                  aria-hidden="true"
                  className="inline-grid h-[15px] w-[15px] shrink-0 place-items-center rounded-full border border-current text-[10px] leading-none opacity-60"
                >
                  ?
                </span>
                <span
                  id={tipId}
                  role="tooltip"
                  className="pointer-events-none absolute top-full left-1/2 z-30 mt-2 hidden w-max max-w-[15rem] -translate-x-1/2 whitespace-normal rounded-lg border border-white/10 bg-night-card px-3 py-2 text-left text-xs font-normal text-neutral-200 shadow-xl group-hover:block group-focus:block"
                >
                  {o.hint}
                </span>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}
