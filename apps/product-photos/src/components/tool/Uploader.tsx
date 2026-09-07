"use client";
import { useEffect, useRef, useState } from "react";
import { assertValidImage } from "@/lib/validation/upload";
import { MAX_REFERENCE_IMAGES } from "@/lib/limits";
import copy from "@/content/copy";
import { cn } from "@/lib/cn";

export function Uploader({ value, onChange }: { value: File[]; onChange: (files: File[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const urls = value.map((f) => URL.createObjectURL(f));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [value]);

  function addFiles(incoming: File[]) {
    if (incoming.length === 0) return;
    const valid: File[] = [];
    let hadInvalid = false;
    for (const f of incoming) {
      const check = assertValidImage({ type: f.type, size: f.size });
      if (check.ok) valid.push(f);
      else hadInvalid = true;
    }
    const room = Math.max(0, MAX_REFERENCE_IMAGES - value.length);
    const accepted = valid.slice(0, room);
    if (hadInvalid) setError(copy.errors.invalidImage);
    else if (valid.length > room) setError(copy.errors.tooManyImages(MAX_REFERENCE_IMAGES));
    else setError(null);
    if (accepted.length > 0) onChange([...value, ...accepted]);
  }

  function remove(index: number) {
    setError(null);
    onChange(value.filter((_, i) => i !== index));
  }

  const atMax = value.length >= MAX_REFERENCE_IMAGES;

  return (
    <div className="flex flex-col gap-3">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {value.map((f, i) => (
            <div key={`${f.name}-${i}`} className="relative">
              {previews[i] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previews[i]}
                  alt=""
                  className="h-24 w-24 rounded-xl border border-white/[0.08] object-cover bg-night-soft"
                />
              ) : (
                <div className="h-24 w-24 rounded-xl border border-white/[0.08] bg-night-soft" />
              )}
              <button
                type="button"
                aria-label={copy.tool.removeImage}
                onClick={() => remove(i)}
                className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-night text-lg leading-none text-neutral-200 hover:text-white"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      {!atMax && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(Array.from(e.dataTransfer.files)); }}
          className={cn(
            "flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-colors min-h-[44px]",
            dragging ? "border-accent bg-accent/5" : "border-white/15 hover:border-white/30",
          )}
        >
          <span className="text-neutral-200">{copy.tool.uploadHint}</span>
          <span className="text-sm text-neutral-500">{copy.tool.uploadFormats}</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => {
          addFiles(Array.from(e.target.files ?? []));
          e.target.value = "";
        }}
      />

      <p className="text-sm text-neutral-500">{copy.tool.referencesHint}</p>
      {error ? <p className="mt-2 text-sm text-accent-light">{error}</p> : null}
    </div>
  );
}
