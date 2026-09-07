"use client";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { type PhotoStatus } from "@/hooks/useBatchGeneration";
import copy from "@/content/copy";

export function ResultsGrid({
  photos, creditsRemaining, onCreateAnother,
}: { photos: PhotoStatus[]; creditsRemaining: number; onCreateAnother: () => void }) {
  const done = photos.filter((p) => p.status === "completed").length;
  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-neutral-400">{copy.tool.batchSummary(done, creditsRemaining)}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {photos.map((p) => (
          <div key={p.id} className="flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-night-soft p-3">
            {p.status === "completed" ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.generatedImageUrl} alt={copy.tool.resultTitle} className="w-full rounded-xl object-contain" />
                <Button variant="outline" href={`${p.generatedImageUrl}?download=1`} download className="w-full">
                  {copy.tool.download}
                </Button>
              </>
            ) : p.status === "failed" ? (
              <div className="flex min-h-[8rem] items-center justify-center px-3 text-center text-sm text-accent-light">
                {copy.errors.generationFailed}
              </div>
            ) : (
              <div className="flex min-h-[8rem] items-center justify-center">
                <Spinner label={copy.tool.generating} />
              </div>
            )}
          </div>
        ))}
      </div>
      <Button variant="ghost" onClick={onCreateAnother} className="self-start">{copy.tool.createAnother}</Button>
    </div>
  );
}
