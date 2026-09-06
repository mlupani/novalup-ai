import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

describe("password", () => {
  it("hashes and verifies a correct password", async () => {
    const h = await hashPassword("s3cret-pass");
    expect(h).not.toBe("s3cret-pass");
    expect(await verifyPassword("s3cret-pass", h)).toBe(true);
  });
  it("rejects a wrong password", async () => {
    const h = await hashPassword("s3cret-pass");
    expect(await verifyPassword("wrong", h)).toBe(false);
  });
});
