"use client";
import { useEffect, useRef, useState } from "react";
import { assertValidImage } from "@/lib/validation/upload";
import copy from "@/content/copy";
import { cn } from "@/lib/cn";

export function Uploader({ value, onChange }: { value: File | null; onChange: (f: File | null) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!value) { setPreview(null); return; }
    const url = URL.createObjectURL(value);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  function accept(file: File | undefined) {
    setError(null);
    if (!file) return;
    const check = assertValidImage({ type: file.type, size: file.size });
    if (!check.ok) { setError(copy.errors.invalidImage); onChange(null); return; }
    onChange(file);
  }

  if (value && preview) {
    return (
      <div className="flex flex-col gap-3">
        <div className="overflow-hidden rounded-2xl border border-white/[0.08]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="preview" className="max-h-80 w-full object-contain bg-night-soft" />
        </div>
        <button type="button" onClick={() => onChange(null)} className="self-start text-sm text-accent-light hover:underline">
          {copy.tool.changeImage}
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); accept(e.dataTransfer.files[0]); }}
        className={cn(
          "flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-colors",
          dragging ? "border-accent bg-accent/5" : "border-white/15 hover:border-white/30",
        )}
      >
        <span className="text-neutral-200">{copy.tool.uploadHint}</span>
        <span className="text-sm text-neutral-500">{copy.tool.uploadFormats}</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => accept(e.target.files?.[0])}
      />
      {error ? <p className="mt-2 text-sm text-accent-light">{error}</p> : null}
    </div>
  );
}
