"use client";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import copy from "@/content/copy";

/** How long each step stays "current" before the next one lights up. */
const STEP_MS = 6000;

/**
 * Takes over the tool while a batch runs.
 *
 * The provider reports no phase information — only pending / completed / failed
 * per photo — so the three steps advance on a timer and hold on the last one.
 * They are a sense-of-progress device, not real telemetry. The batch counter
 * underneath is the honest signal: it comes from the polled statuses.
 */
export function GeneratingPanel({ total, completed }: { total: number; completed: number }) {
  const steps = copy.tool.generatingSteps;
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setStep((s) => Math.min(s + 1, steps.length - 1));
    }, STEP_MS);
    return () => clearInterval(id);
  }, [steps.length]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="mx-auto flex w-full max-w-md flex-col items-center gap-8 py-16 text-center"
    >
      <div className="flex flex-col gap-2">
        <p className="text-xl font-semibold text-white">{copy.tool.generatingTitle(total)}</p>
        <p className="text-sm text-neutral-400">{copy.tool.generatingSubtitle(total)}</p>
      </div>

      <span className="animate-sparkle text-5xl leading-none" aria-hidden="true">✨</span>

      <ol className="flex flex-col gap-3">
        {steps.map((label, i) => {
          const done = i < step;
          const current = i === step;
          return (
            <li
              key={label}
              className={cn(
                "flex items-center gap-3 text-sm transition-colors",
                current ? "text-white" : done ? "text-neutral-400" : "text-neutral-600",
              )}
            >
              {/* ✓ done · ◉ in progress · ○ pending */}
              <span
                aria-hidden="true"
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] leading-none",
                  done && "bg-accent/20 text-accent-light",
                  current && "border-2 border-accent-light",
                  !done && !current && "border border-white/15",
                )}
              >
                {done ? "✓" : null}
                {current ? (
                  <span className="animate-step-pulse h-1.5 w-1.5 rounded-full bg-accent-light" />
                ) : null}
              </span>
              {label}
            </li>
          );
        })}
      </ol>

      {total > 1 ? (
        <p className="text-sm text-neutral-500">{copy.tool.creatingBatch(completed, total)}</p>
      ) : null}
    </div>
  );
}
