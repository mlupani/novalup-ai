"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Uploader } from "@/components/tool/Uploader";
import { type OptionValue } from "@/components/tool/OptionPicker";
import { PhotoCountSelector } from "@/components/tool/PhotoCountSelector";
import { PhotoOptionsList } from "@/components/tool/PhotoOptionsList";
import { GeneratePanel } from "@/components/tool/GeneratePanel";
import { ResultsGrid } from "@/components/tool/ResultsGrid";
import { OutOfCreditsCard } from "@/components/tool/OutOfCreditsCard";
import { useBatchGeneration } from "@/hooks/useBatchGeneration";
import { Field, inputClass } from "@/components/ui/Field";
import copy from "@/content/copy";

const EMPTY: OptionValue = { format: null, style: null, background: null };
const resize = (arr: OptionValue[], n: number): OptionValue[] =>
  Array.from({ length: n }, (_, i) => arr[i] ?? { ...EMPTY });

export function ProductPhotoTool({
  initialCredits, user,
}: { initialCredits: number; user: { name: string | null; email: string } }) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [count, setCount] = useState(1);
  const [options, setOptions] = useState<OptionValue[]>([{ ...EMPTY }]);
  const [instructions, setInstructions] = useState("");
  const { state, photos, creditsRemaining, error, start, reset } = useBatchGeneration();

  useEffect(() => {
    if (state === "done") router.refresh();
  }, [state, router]);

  if ((initialCredits <= 0 && state !== "done") || state === "out_of_credits") {
    return <OutOfCreditsCard name={user.name} email={user.email} />;
  }

  const active = options.slice(0, count);
  const ready = files.length >= 1 && active.every((o) => o.format && o.style && o.background);
  const pending = state === "starting" || state === "generating";
  const completed = photos.filter((p) => p.status === "completed").length;

  async function generate() {
    if (!ready) return;
    await start({
      referenceImages: files,
      photos: active.map((o) => ({ format: o.format!, style: o.style!, background: o.background! })),
      instructions,
    });
  }

  if (state === "done") {
    return (
      <ResultsGrid
        photos={photos}
        creditsRemaining={creditsRemaining ?? initialCredits}
        onCreateAnother={() => {
          reset();
          setFiles([]);
          setCount(1);
          setOptions([{ ...EMPTY }]);
          setInstructions("");
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">{copy.tool.title}</h1>
        <p className="text-neutral-400">{copy.tool.subtitle}</p>
      </div>

      <Uploader value={files} onChange={setFiles} />

      {files.length >= 1 && (
        <>
          <PhotoCountSelector
            value={count}
            onChange={(n) => { setCount(n); setOptions((prev) => resize(prev, n)); }}
          />
          <PhotoOptionsList count={count} value={options} onChange={setOptions} />

          <Field label={copy.tool.instructionsLabel} htmlFor="instructions">
            <textarea
              id="instructions"
              className={inputClass}
              rows={3}
              maxLength={1000}
              placeholder={copy.tool.instructionsPlaceholder}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </Field>

          <GeneratePanel
            needed={count}
            available={initialCredits}
            disabled={!ready}
            pending={pending}
            progressLabel={copy.tool.creatingBatch(completed, count)}
            onGenerate={generate}
          />
        </>
      )}

      {state === "failed" && error ? <p className="text-sm text-accent-light">{error}</p> : null}
    </div>
  );
}
