import { describe, it, expect, vi, beforeEach } from "vitest";

const { findUnique, create } = vi.hoisted(() => {
  return {
    findUnique: vi.fn(),
    create: vi.fn(),
  };
});

vi.mock("@/lib/db/client", () => ({ prisma: { user: { findUnique, create } } }));
vi.mock("@/lib/auth/password", () => ({ hashPassword: vi.fn().mockResolvedValue("HASH") }));

import { POST } from "@/app/api/auth/signup/route";
import { FREE_CREDITS } from "@/lib/credits/config";

function req(body: unknown) {
  return new Request("http://localhost/api/auth/signup", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => { findUnique.mockReset(); create.mockReset(); });

const valid = { name: "Ana", email: "a@b.com", password: "12345678", confirmPassword: "12345678" };

describe("POST /api/auth/signup", () => {
  it("creates a user with hashed password and free credits", async () => {
    findUnique.mockResolvedValue(null);
    create.mockResolvedValue({ id: "u1" });
    const res = await POST(req(valid));
    expect(res.status).toBe(201);
    expect(create).toHaveBeenCalledWith({
      data: { name: "Ana", email: "a@b.com", passwordHash: "HASH", credits: FREE_CREDITS },
    });
  });
  it("rejects a duplicate email with 409", async () => {
    findUnique.mockResolvedValue({ id: "existing" });
    const res = await POST(req(valid));
    expect(res.status).toBe(409);
  });
  it("maps a P2002 unique-constraint race on create to 409", async () => {
    findUnique.mockResolvedValue(null);
    create.mockRejectedValue({ code: "P2002" });
    const res = await POST(req(valid));
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "email_taken" });
  });
  it("rejects mismatched passwords with 422", async () => {
    const res = await POST(req({ ...valid, confirmPassword: "99999999" }));
    expect(res.status).toBe(422);
  });
});
