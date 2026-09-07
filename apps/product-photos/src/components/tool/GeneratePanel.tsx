"use client";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import copy from "@/content/copy";

export function GeneratePanel({
  disabled, pending, onGenerate,
}: { disabled: boolean; pending: boolean; onGenerate: () => void }) {
  if (pending) return <Spinner label={copy.tool.generating} />;
  return (
    <Button size="lg" disabled={disabled} onClick={onGenerate} className="w-full sm:w-auto">
      {copy.tool.generate}
    </Button>
  );
}
