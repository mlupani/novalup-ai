"use client";
import { OptionPicker, type OptionValue } from "@/components/tool/OptionPicker";
import copy from "@/content/copy";

export function PhotoOptionsList({
  count, value, onChange,
}: { count: number; value: OptionValue[]; onChange: (next: OptionValue[]) => void }) {
  return (
    <div className="flex flex-col gap-8">
      {Array.from({ length: count }, (_, i) => (
        <OptionPicker
          key={i}
          title={count > 1 ? copy.tool.photoNLabel(i + 1) : undefined}
          value={value[i] ?? { format: null, style: null, background: null }}
          onChange={(patch) =>
            onChange(value.map((v, idx) => (idx === i ? { ...v, ...patch } : v)))
          }
        />
      ))}
    </div>
  );
}
