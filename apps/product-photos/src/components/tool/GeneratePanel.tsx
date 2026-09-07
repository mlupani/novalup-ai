"use client";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/cn";
import copy from "@/content/copy";

export function GeneratePanel({
  needed, available, disabled, pending, progressLabel, onGenerate,
}: { needed: number; available: number; disabled: boolean; pending: boolean; progressLabel: string; onGenerate: () => void }) {
  if (pending) return <Spinner label={progressLabel} />;
  const short = available < needed;
  return (
    <div className="flex flex-col gap-3">
      <p className={cn("text-sm", short ? "text-accent-light" : "text-neutral-400")}>
        {copy.tool.creditsNeeded(needed, available)}
      </p>
      <Button size="lg" disabled={disabled || short} onClick={onGenerate} className="w-full sm:w-auto">
        {copy.tool.generateN(needed)}
      </Button>
    </div>
  );
}
