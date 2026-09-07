import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { submitFeedback } from "@/lib/feedback/formsubmit";

const OLD = { ...process.env };
beforeEach(() => {
  process.env.FORMSUBMIT_EMAIL = "owner@example.com";
  process.env.NEXTAUTH_URL = "https://app.example.com";
});
afterEach(() => { process.env = { ...OLD }; vi.restoreAllMocks(); });

const payload = { email: "user@example.com", message: "me encantó la app" };

describe("submitFeedback", () => {
  it("posts the comment and the session email to the configured FormSubmit inbox", async () => {
    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ success: "true" }), { status: 200 }),
    );
    await submitFeedback(payload);
    expect(String(fetchMock.mock.calls[0][0])).toBe("https://formsubmit.co/ajax/owner@example.com");
    const sent = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(sent._subject).toBe("Novalup AI — Product Photos feedback");
    expect(sent.email).toBe("user@example.com");
    expect(sent._replyto).toBe("user@example.com");
    expect(sent.message).toBe("me encantó la app");
  });
  it("sends a Referer header so FormSubmit accepts the server-side request", async () => {
    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ success: "true" }), { status: 200 }),
    );
    await submitFeedback(payload);
    const headers = new Headers((fetchMock.mock.calls[0][1] as RequestInit).headers);
    expect(headers.get("referer")).toBe("https://app.example.com/app");
  });
  it("throws when FORMSUBMIT_EMAIL is missing", async () => {
    delete process.env.FORMSUBMIT_EMAIL;
    await expect(submitFeedback(payload)).rejects.toThrow(/FORMSUBMIT_EMAIL/);
  });
  it("throws on a non-ok response", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(new Response("nope", { status: 500 }));
    await expect(submitFeedback(payload)).rejects.toThrow();
  });
  it("throws when success is false", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ success: "false" }), { status: 200 }),
    );
    await expect(submitFeedback(payload)).rejects.toThrow();
  });
});
