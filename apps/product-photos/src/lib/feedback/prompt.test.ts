import { describe, it, expect } from "vitest";
import { shouldPromptFeedback } from "@/lib/feedback/prompt";

const base = { completed: 2, creditsLeft: 1, alreadySeen: false };

describe("shouldPromptFeedback", () => {
  it("prompts after a successful batch when credits remain and it was never shown", () => {
    expect(shouldPromptFeedback(base)).toBe(true);
  });
  it("does not prompt when the user has no credits left", () => {
    expect(shouldPromptFeedback({ ...base, creditsLeft: 0 })).toBe(false);
  });
  it("does not prompt when no photo completed", () => {
    expect(shouldPromptFeedback({ ...base, completed: 0 })).toBe(false);
  });
  it("does not prompt again once it has been shown", () => {
    expect(shouldPromptFeedback({ ...base, alreadySeen: true })).toBe(false);
  });
});
