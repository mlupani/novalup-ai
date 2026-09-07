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
  value, onChange, title,
}: { value: OptionValue; onChange: (patch: Partial<OptionValue>) => void; title?: string }) {
  return (
    <div className="flex flex-col gap-6">
      {title ? <h3 className="text-sm font-semibold text-neutral-200">{title}</h3> : null}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-neutral-300">{copy.tool.formatLabel}</span>
        <SegmentedControl
          ariaLabel={copy.tool.formatLabel}
          options={FORMATS.map((f) => ({ value: f.id, label: copy.tool.formats[f.id] }))}
          value={value.format}
          onChange={(v) => onChange({ format: v })}
        />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-neutral-300">{copy.tool.styleLabel}</span>
        <SegmentedControl
          ariaLabel={copy.tool.styleLabel}
          options={STYLES.map((s) => ({ value: s, label: copy.tool.styles[s] }))}
          value={value.style}
          onChange={(v) => onChange({ style: v })}
        />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-neutral-300">{copy.tool.backgroundLabel}</span>
        <SegmentedControl
          ariaLabel={copy.tool.backgroundLabel}
          options={BACKGROUNDS.map((b) => ({ value: b, label: copy.tool.backgrounds[b] }))}
          value={value.background}
          onChange={(v) => onChange({ background: v })}
        />
      </div>
    </div>
  );
}
