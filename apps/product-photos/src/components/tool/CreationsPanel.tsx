"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { toDownloadUrl } from "@/lib/storage/download";
import copy from "@/content/copy";

interface Generation {
  id: string;
  generatedImageUrl: string | null;
  referenceImageUrls: string[];
  format: string;
  style: string;
  background: string;
  instructions: string | null;
  prompt: string;
  status: string;
  error: string | null;
  createdAt: Date;
}

export function CreationsPanel({ onBack }: { onBack: () => void }) {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/generations")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.generations) {
          setGenerations(data.generations);
        } else {
          setError(copy.errors.generic);
        }
      })
      .catch(() => setError(copy.errors.generic))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack} className="text-sm">&larr; {copy.tool.createAnother}</Button>
        <h2 className="text-xl font-bold">{copy.tool.creationsTitle}</h2>
      </div>

      {loading && (
        <div className="flex min-h-[8rem] items-center justify-center">
          <span className="text-sm text-neutral-400">Cargando creaciones…</span>
        </div>
      )}

      {error && <p className="text-sm text-accent-light">{error}</p>}

      {!loading && generations.length === 0 && (
        <p className="text-sm text-neutral-400">{copy.tool.noCreations}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {generations.map((g) => (
          <div key={g.id} className="flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-night-card/60 p-4">
            <p className="text-xs text-neutral-500">{copy.tool.dateLabel(g.createdAt)}</p>

            {g.generatedImageUrl && (
              <img
                src={g.generatedImageUrl}
                alt={copy.tool.imageLabel}
                className="w-full rounded-xl object-contain"
              />
            )}

            <div className="flex flex-col gap-1 text-xs text-neutral-400">
              <p>
                <span className="text-neutral-300">{copy.tool.formatLabel}:</span> {g.format}
              </p>
              <p>
                <span className="text-neutral-300">{copy.tool.styleLabel}:</span> {g.style}
              </p>
              <p>
                <span className="text-neutral-300">{copy.tool.backgroundLabel}:</span> {g.background}
              </p>
            </div>

            {g.referenceImageUrls.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {g.referenceImageUrls.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`${copy.tool.referenceLabel} ${i + 1}`}
                    className="h-16 w-16 rounded-lg object-cover border border-white/10"
                  />
                ))}
              </div>
            )}

            {g.prompt && (
              <div className="rounded-lg bg-night-soft p-3 text-xs text-neutral-300">
                <p className="font-medium text-neutral-200">{copy.tool.promptLabel}</p>
                <p>{g.prompt}</p>
              </div>
            )}

            {g.instructions && (
              <div className="rounded-lg bg-night-soft p-3 text-xs text-neutral-300">
                <p className="font-medium text-neutral-200">{copy.tool.creationsInstructionsLabel}</p>
                <p>{g.instructions}</p>
              </div>
            )}

            {g.status === "failed" && g.error && (
              <p className="text-xs text-accent-light">{g.error}</p>
            )}

            <div className="flex gap-2">
              {g.generatedImageUrl && (
                <Button
                  variant="outline"
                  size="md"
                  href={toDownloadUrl(g.generatedImageUrl)}
                  download
                  className="text-xs"
                >
                  {copy.tool.download}
                </Button>
              )}
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                g.status === "completed"
                  ? "bg-green-500/20 text-green-400"
                  : g.status === "failed"
                  ? "bg-red-500/20 text-red-400"
                  : "bg-yellow-500/20 text-yellow-400"
              }`}>
                {g.status === "completed" ? copy.tool.statusCompleted
                  : g.status === "failed" ? copy.tool.statusFailed
                  : copy.tool.statusPending}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
