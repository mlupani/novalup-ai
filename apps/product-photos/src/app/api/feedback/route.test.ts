import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth/session", () => ({ requireUser: vi.fn() }));
vi.mock("@/lib/feedback/formsubmit", () => ({ submitFeedback: vi.fn() }));

import { POST } from "@/app/api/feedback/route";
import { requireUser } from "@/lib/auth/session";
import { submitFeedback } from "@/lib/feedback/formsubmit";

const req = (b: unknown) =>
  new Request("http://x/api/feedback", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(b) });

beforeEach(() => {
  vi.mocked(requireUser).mockResolvedValue({ id: "u1", email: "ana@example.com", name: "Ana" });
  vi.mocked(submitFeedback).mockReset().mockResolvedValue(undefined);
});

describe("POST /api/feedback", () => {
  it("401 without a session", async () => {
    vi.mocked(requireUser).mockResolvedValue(null);
    expect((await POST(req({ message: "hola" }))).status).toBe(401);
  });
  it("sends the comment with the session email, ignoring any email in the body", async () => {
    const res = await POST(req({ message: "muy buena", email: "spoof@evil.com" }));
    expect(res.status).toBe(200);
    expect(submitFeedback).toHaveBeenCalledWith({ email: "ana@example.com", message: "muy buena" });
  });
  it("422 on an empty message", async () => {
    expect((await POST(req({ message: "   " }))).status).toBe(422);
  });
  it("502 when the send fails", async () => {
    vi.mocked(submitFeedback).mockRejectedValue(new Error("down"));
    expect((await POST(req({ message: "hola" }))).status).toBe(502);
  });
});
