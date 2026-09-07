"use client";
import { useEffect, useRef } from "react";
import { FeedbackForm } from "@/components/tool/FeedbackForm";
import copy from "@/content/copy";

/**
 * Feedback popup shown once, right after a batch finishes (see
 * `shouldPromptFeedback`). A native <dialog> so Esc, focus trapping and the
 * inert backdrop come for free; backdrop clicks are wired up by hand.
 */
export function FeedbackDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className="w-[min(28rem,calc(100vw-2rem))] rounded-2xl border border-white/[0.08] bg-night-card p-0 text-white backdrop:bg-black/70"
    >
      <div className="flex flex-col gap-4 p-6">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold">{copy.feedback.popupTitle}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={copy.feedback.close}
            className="-m-1 rounded-lg p-1 text-neutral-400 transition-colors hover:text-white"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        {/* Remount per open so a repeat visit starts on a blank form, not the
            "thanks" state left over from a previous submission this session. */}
        {open && <FeedbackForm />}
      </div>
    </dialog>
  );
}
