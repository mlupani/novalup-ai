"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Uploader } from "@/components/tool/Uploader";
import { OptionPicker, type OptionValue } from "@/components/tool/OptionPicker";
import { GeneratePanel } from "@/components/tool/GeneratePanel";
import { ResultCard } from "@/components/tool/ResultCard";
import { OutOfCreditsCard } from "@/components/tool/OutOfCreditsCard";
import { useGeneration } from "@/hooks/useGeneration";
import copy from "@/content/copy";

const EMPTY: OptionValue = { format: null, style: null, background: null, instructions: "" };

export function ProductPhotoTool({
  initialCredits, user,
}: { initialCredits: number; user: { name: string | null; email: string } }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [options, setOptions] = useState<OptionValue>(EMPTY);
  const { state, result, error, start, reset } = useGeneration();

  useEffect(() => {
    if (state === "completed") router.refresh();
  }, [state, router]);

  if (initialCredits <= 0 && state !== "completed") {
    return <OutOfCreditsCard name={user.name} email={user.email} />;
  }
  if (state === "out_of_credits") {
    return <OutOfCreditsCard name={user.name} email={user.email} />;
  }

  const ready = Boolean(file && options.format && options.style && options.background);
  const pending = state === "starting" || state === "generating";

  async function generate() {
    if (!file || !options.format || !options.style || !options.background) return;
    await start({
      image: file,
      format: options.format,
      style: options.style,
      background: options.background,
      instructions: options.instructions,
    });
  }

  if (state === "completed" && result) {
    return (
      <ResultCard
        imageUrl={result.generatedImageUrl}
        creditsRemaining={result.creditsRemaining}
        onAgain={generate}
        onAnother={() => { reset(); setFile(null); setOptions(EMPTY); }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">{copy.tool.title}</h1>
        <p className="text-neutral-400">{copy.tool.subtitle}</p>
      </div>
      <Uploader value={file} onChange={setFile} />
      {file && <OptionPicker value={options} onChange={(patch) => setOptions((o) => ({ ...o, ...patch }))} />}
      {file && <GeneratePanel disabled={!ready || pending} pending={pending} onGenerate={generate} />}
      {state === "failed" && error ? <p className="text-sm text-accent-light">{error}</p> : null}
    </div>
  );
}
