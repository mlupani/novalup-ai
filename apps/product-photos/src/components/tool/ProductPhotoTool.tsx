"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Uploader } from "@/components/tool/Uploader";
import { type OptionValue } from "@/components/tool/OptionPicker";
import { PhotoCountSelector } from "@/components/tool/PhotoCountSelector";
import { PhotoOptionsList } from "@/components/tool/PhotoOptionsList";
import { GeneratePanel } from "@/components/tool/GeneratePanel";
import { GeneratingPanel } from "@/components/tool/GeneratingPanel";
import { ResultsGrid } from "@/components/tool/ResultsGrid";
import { OutOfCreditsCard } from "@/components/tool/OutOfCreditsCard";
import { FeedbackDialog } from "@/components/tool/FeedbackDialog";
import { useBatchGeneration } from "@/hooks/useBatchGeneration";
import { Field, inputClass } from "@/components/ui/Field";
import { FEEDBACK_PROMPT_KEY, shouldPromptFeedback } from "@/lib/feedback/prompt";
import copy from "@/content/copy";

const EMPTY: OptionValue = { format: null, style: null, background: null };
const resize = (arr: OptionValue[], n: number): OptionValue[] =>
  Array.from({ length: n }, (_, i) => arr[i] ?? { ...EMPTY });

export function ProductPhotoTool({
  initialCredits,
}: { initialCredits: number }) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [count, setCount] = useState(1);
  const [options, setOptions] = useState<OptionValue[]>([{ ...EMPTY }]);
  const [instructions, setInstructions] = useState("");
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [prevState, setPrevState] = useState<typeof state>("idle");
  const { state, photos, creditsRemaining, error, start, reset } = useBatchGeneration();

  useEffect(() => {
    if (state === "done") router.refresh();
  }, [state, router]);

  // Persist "the popup was shown" so it never opens for this user again.
  useEffect(() => {
    if (!feedbackOpen) return;
    try {
      localStorage.setItem(FEEDBACK_PROMPT_KEY, "1");
    } catch {
      // storage blocked (private mode) — it just shows once per load instead
    }
  }, [feedbackOpen]);

  // The moment a batch finishes, decide whether to prompt for feedback — once
  // per user, and only while credits remain (a user at zero gets the
  // out-of-credits screen, which carries its own form). Done during render (not
  // in an effect) so opening the dialog doesn't cascade an extra render.
  if (state !== prevState) {
    setPrevState(state);
    if (state === "done") {
      const creditsLeft = creditsRemaining ?? initialCredits;
      const completedCount = photos.filter((p) => p.status === "completed").length;
      let alreadySeen = false;
      try {
        alreadySeen = localStorage.getItem(FEEDBACK_PROMPT_KEY) === "1";
      } catch {
        alreadySeen = false;
      }
      if (shouldPromptFeedback({ completed: completedCount, creditsLeft, alreadySeen })) {
        setFeedbackOpen(true);
      }
    }
  }

  if ((initialCredits <= 0 && state !== "done") || state === "out_of_credits") {
    return <OutOfCreditsCard />;
  }

  const active = options.slice(0, count);
  const ready = files.length >= 1 && active.every((o) => o.format && o.style && o.background);
  const completed = photos.filter((p) => p.status === "completed").length;

  if (state === "starting" || state === "generating") {
    return <GeneratingPanel total={count} completed={completed} />;
  }

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
      <>
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
          onFeedback={() => setFeedbackOpen(true)}
        />
        <FeedbackDialog open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
      </>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">{copy.tool.title}</h1>
        <p className="text-neutral-400">{copy.tool.subtitle}</p>
      </div>

      {/* Desktop splits what you bring (left) from how it should look (right);
          the options column is wider because it carries the tabbed card. */}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-10">
        <Uploader value={files} onChange={setFiles} />

        <div className="flex flex-col gap-8">
          {files.length >= 1 ? (
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
                onGenerate={generate}
              />
            </>
          ) : (
            // Keeps the two columns in place so the layout doesn't jump on upload.
            <div className="flex min-h-[14rem] items-center justify-center rounded-2xl border border-dashed border-white/10 px-6 text-center text-sm text-neutral-500">
              {copy.tool.optionsPlaceholder}
            </div>
          )}

          {state === "failed" && error ? <p className="text-sm text-accent-light">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
