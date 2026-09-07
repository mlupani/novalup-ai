"use client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import copy from "@/content/copy";

export function ResultCard({
  imageUrl, creditsRemaining, onAgain, onAnother,
}: { imageUrl: string; creditsRemaining: number; onAgain: () => void; onAnother: () => void }) {
  return (
    <Card className="flex flex-col gap-5">
      <h2 className="text-lg font-semibold">{copy.tool.resultTitle}</h2>
      <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-night-soft">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt={copy.tool.resultTitle} className="mx-auto max-h-[70vh] w-full object-contain" />
      </div>
      <p className="text-sm text-neutral-400">{copy.tool.creditUsed(creditsRemaining)}</p>
      <div className="flex flex-wrap gap-3">
        <Button onClick={onAgain}>{copy.tool.generateAgain}</Button>
        <Button variant="outline" href={`${imageUrl}?download=1`}>{copy.tool.download}</Button>
        <Button variant="ghost" onClick={onAnother}>{copy.tool.createAnother}</Button>
      </div>
    </Card>
  );
}
