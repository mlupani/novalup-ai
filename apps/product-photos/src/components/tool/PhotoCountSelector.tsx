"use client";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { MAX_PHOTOS } from "@/lib/limits";
import copy from "@/content/copy";

export function PhotoCountSelector({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const options = Array.from({ length: MAX_PHOTOS }, (_, i) => ({
    value: String(i + 1),
    label: copy.tool.photoCountOption(i + 1),
  }));
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-neutral-300">{copy.tool.photoCountLabel}</span>
      <SegmentedControl
        ariaLabel={copy.tool.photoCountLabel}
        options={options}
        value={String(value)}
        onChange={(v) => onChange(Number(v))}
      />
    </div>
  );
}
