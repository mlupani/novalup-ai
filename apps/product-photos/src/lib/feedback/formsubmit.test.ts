import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { submitFeedback } from "@/lib/feedback/formsubmit";

const OLD = { ...process.env };
beforeEach(() => { process.env.FORMSUBMIT_EMAIL = "owner@example.com"; });
afterEach(() => { process.env = { ...OLD }; vi.restoreAllMocks(); });

const payload = { name: "Ana", email: "a@b.com", thoughts: "great", nextIdeas: "shoes" };

describe("submitFeedback", () => {
  it("posts to the FormSubmit ajax endpoint for the configured email", async () => {
    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ success: "true" }), { status: 200 }),
    );
    await submitFeedback(payload);
    expect(String(fetchMock.mock.calls[0][0])).toBe("https://formsubmit.co/ajax/owner@example.com");
    const sent = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(sent.email).toBe("a@b.com");
    expect(sent.message).toBe("great");
  });
  it("throws when FORMSUBMIT_EMAIL is missing", async () => {
    delete process.env.FORMSUBMIT_EMAIL;
    await expect(submitFeedback(payload)).rejects.toThrow(/FORMSUBMIT_EMAIL/);
  });
  it("throws on a non-ok response", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(new Response("nope", { status: 500 }));
    await expect(submitFeedback(payload)).rejects.toThrow();
  });
});
