/** localStorage key that records the feedback popup was already shown once. */
export const FEEDBACK_PROMPT_KEY = "novalup:feedback-prompt-seen";

/**
 * Whether to open the post-generation feedback popup.
 *
 * Shown once per user (persisted in `localStorage`), only after a batch that
 * produced at least one photo, and only while the user still has credits — a
 * user out of credits lands on the out-of-credits screen, which carries its own
 * feedback form.
 */
export function shouldPromptFeedback(opts: {
  completed: number;
  creditsLeft: number;
  alreadySeen: boolean;
}): boolean {
  return opts.completed > 0 && opts.creditsLeft > 0 && !opts.alreadySeen;
}
