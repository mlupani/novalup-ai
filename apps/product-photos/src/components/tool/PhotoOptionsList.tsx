"use client";
import { useState } from "react";
import { OptionPicker, type OptionValue } from "@/components/tool/OptionPicker";
import { cn } from "@/lib/cn";
import copy from "@/content/copy";

const EMPTY: OptionValue = { format: null, style: null, background: null };
const isComplete = (o: OptionValue) => Boolean(o.format && o.style && o.background);

const cardClass = "rounded-2xl border border-white/[0.08] bg-night-card/60";

export function PhotoOptionsList({
  count, value, onChange,
}: { count: number; value: OptionValue[]; onChange: (next: OptionValue[]) => void }) {
  const [active, setActive] = useState(0);
  const [prevCount, setPrevCount] = useState(count);

  // Keep the active tab in range when the photo count shrinks.
  if (count !== prevCount) {
    setPrevCount(count);
    if (active > count - 1) setActive(count - 1);
  }
  const current = Math.min(active, count - 1);

  const patch = (i: number) => (p: Partial<OptionValue>) =>
    onChange(value.map((v, idx) => (idx === i ? { ...v, ...p } : v)));

  if (count === 1) {
    return (
      <div className={cn(cardClass, "p-5 sm:p-6")}>
        <OptionPicker value={value[0] ?? { ...EMPTY }} onChange={patch(0)} />
      </div>
    );
  }

  return (
    <div className={cardClass}>
      <div
        role="tablist"
        aria-label={copy.tool.photoTabsLabel}
        className="flex flex-wrap gap-1 border-b border-white/[0.08] px-3 pt-1"
      >
        {Array.from({ length: count }, (_, i) => {
          const done = isComplete(value[i] ?? EMPTY);
          return (
            <button
              key={i}
              type="button"
              role="tab"
              id={`photo-tab-${i}`}
              aria-selected={i === current}
              aria-controls={`photo-panel-${i}`}
              tabIndex={i === current ? 0 : -1}
              onClick={() => setActive(i)}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight") { e.preventDefault(); setActive((current + 1) % count); }
                if (e.key === "ArrowLeft") { e.preventDefault(); setActive((current - 1 + count) % count); }
              }}
              className={cn(
                "-mb-px inline-flex min-h-[44px] items-center gap-2 border-b-2 px-3 text-sm font-medium transition-colors",
                i === current
                  ? "border-accent text-white"
                  : "border-transparent text-neutral-400 hover:text-neutral-200",
              )}
            >
              {copy.tool.photoNLabel(i + 1)}
              {!done && (
                <span
                  aria-hidden="true"
                  title={copy.tool.photoTabIncomplete}
                  className="h-1.5 w-1.5 rounded-full bg-accent-light"
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="p-5 sm:p-6">
        {Array.from({ length: count }, (_, i) => (
          <div
            key={i}
            role="tabpanel"
            id={`photo-panel-${i}`}
            aria-labelledby={`photo-tab-${i}`}
            hidden={i !== current}
          >
            <OptionPicker value={value[i] ?? { ...EMPTY }} onChange={patch(i)} />
          </div>
        ))}
      </div>
    </div>
  );
}
