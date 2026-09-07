"use client";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { type PhotoStatus } from "@/hooks/useBatchGeneration";
import { toDownloadUrl } from "@/lib/storage/download";
import { cn } from "@/lib/cn";
import copy from "@/content/copy";

export function ResultsGrid({
  photos, creditsRemaining, onCreateAnother, onFeedback,
}: {
  photos: PhotoStatus[];
  creditsRemaining: number;
  onCreateAnother: () => void;
  onFeedback: () => void;
}) {
  const done = photos.filter((p) => p.status === "completed").length;
  const single = photos.length === 1;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-8 text-center">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold">{copy.tool.resultsTitle(done)}</h2>
        {done > 0 ? <p className="text-neutral-400">{copy.tool.resultsSubtitle(done)}</p> : null}
      </div>

      <div className={cn("grid w-full gap-6", single ? "max-w-lg" : "sm:grid-cols-2")}>
        {photos.map((p) => (
          <div key={p.id} className="flex flex-col gap-4">
            {p.status === "completed" ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.generatedImageUrl}
                  alt={copy.tool.resultTitle}
                  className="w-full rounded-2xl border border-white/[0.08] object-contain"
                />
                {/* Primary action: after generating, taking the image is what
                    the user came for. */}
                <Button
                  href={toDownloadUrl(p.generatedImageUrl)}
                  download
                  size={single ? "lg" : "md"}
                  className="w-full"
                >
                  {single ? copy.tool.downloadImage : copy.tool.downloadOne}
                </Button>
              </>
            ) : p.status === "failed" ? (
              <div className="flex min-h-[8rem] items-center justify-center rounded-2xl border border-white/[0.08] bg-night-soft px-3 text-sm text-accent-light">
                {copy.errors.generationFailed}
              </div>
            ) : (
              <div className="flex min-h-[8rem] items-center justify-center rounded-2xl border border-white/[0.08] bg-night-soft">
                <Spinner label={copy.tool.generating} />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button variant="ghost" onClick={onCreateAnother}>{copy.tool.createAnother}</Button>
        <span aria-hidden="true" className="text-neutral-600">·</span>
        <Button variant="ghost" onClick={onFeedback}>{copy.feedback.openButton}</Button>
      </div>

      <p className="text-sm text-neutral-500">{copy.tool.batchSummary(done, creditsRemaining)}</p>
    </div>
  );
}
