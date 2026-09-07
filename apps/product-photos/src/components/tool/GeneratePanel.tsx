"use client";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import copy from "@/content/copy";

export function GeneratePanel({
  needed, available, disabled, onGenerate,
}: { needed: number; available: number; disabled: boolean; onGenerate: () => void }) {
  const short = available < needed;
  return (
    <div className="flex flex-col gap-3">
      {/* The button now spells out the cost, so this line only needs to carry
          the balance — unless there aren't enough credits, where the shortfall
          is the point. */}
      <p className={cn("text-sm", short ? "text-accent-light" : "text-neutral-400")}>
        {short ? copy.tool.creditsNeeded(needed, available) : copy.credits.remainingLabel(available)}
      </p>
      <Button size="lg" disabled={disabled || short} onClick={onGenerate} className="w-full sm:w-auto">
        {copy.tool.generateN(needed)}
      </Button>
    </div>
  );
}
