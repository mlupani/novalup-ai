import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth/session", () => ({ requireUser: vi.fn() }));
vi.mock("@/lib/feedback/formsubmit", () => ({ submitFeedback: vi.fn() }));

import { POST } from "@/app/api/feedback/route";
import { requireUser } from "@/lib/auth/session";
import { submitFeedback } from "@/lib/feedback/formsubmit";

const body = { name: "Ana", email: "a@b.com", thoughts: "cool", nextIdeas: "sneakers" };
const req = (b: unknown) =>
  new Request("http://x/api/feedback", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(b) });

beforeEach(() => {
  vi.mocked(requireUser).mockResolvedValue({ id: "u1", email: "a@b.com", name: "Ana" });
  vi.mocked(submitFeedback).mockReset().mockResolvedValue(undefined);
});

describe("POST /api/feedback", () => {
  it("401 without a session", async () => {
    vi.mocked(requireUser).mockResolvedValue(null);
    expect((await POST(req(body))).status).toBe(401);
  });
  it("forwards a valid payload to submitFeedback", async () => {
    const res = await POST(req(body));
    expect(res.status).toBe(200);
    expect(submitFeedback).toHaveBeenCalledWith(body);
  });
  it("422 on an invalid payload", async () => {
    expect((await POST(req({ ...body, email: "nope" }))).status).toBe(422);
  });
  it("502 when the send fails", async () => {
    vi.mocked(submitFeedback).mockRejectedValue(new Error("down"));
    expect((await POST(req(body))).status).toBe(502);
  });
});
