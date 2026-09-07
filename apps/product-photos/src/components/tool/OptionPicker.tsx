"use client";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { FORMATS, STYLES, BACKGROUNDS } from "@/lib/ai/options";
import type { FormatId, StyleId, BackgroundId } from "@/lib/ai/options";
import copy from "@/content/copy";

export type OptionValue = {
  format: FormatId | null;
  style: StyleId | null;
  background: BackgroundId | null;
};

export function OptionPicker({
  value, onChange,
}: { value: OptionValue; onChange: (patch: Partial<OptionValue>) => void }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-neutral-300">{copy.tool.formatLabel}</span>
        <SegmentedControl
          ariaLabel={copy.tool.formatLabel}
          options={FORMATS.map((f) => ({ value: f.id, label: copy.tool.formats[f.id], hint: copy.tool.formatHints[f.id] }))}
          value={value.format}
          onChange={(v) => onChange({ format: v })}
        />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-neutral-300">{copy.tool.styleLabel}</span>
        <SegmentedControl
          ariaLabel={copy.tool.styleLabel}
          options={STYLES.map((s) => ({ value: s, label: copy.tool.styles[s], hint: copy.tool.styleHints[s] }))}
          value={value.style}
          onChange={(v) => onChange({ style: v })}
        />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-neutral-300">{copy.tool.backgroundLabel}</span>
        <SegmentedControl
          ariaLabel={copy.tool.backgroundLabel}
          options={BACKGROUNDS.map((b) => ({ value: b, label: copy.tool.backgrounds[b], hint: copy.tool.backgroundHints[b] }))}
          value={value.background}
          onChange={(v) => onChange({ background: v })}
        />
      </div>
    </div>
  );
}
