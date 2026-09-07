// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useBatchGeneration } from "@/hooks/useBatchGeneration";

const file = new File([new Uint8Array([1, 2, 3])], "p.png", { type: "image/png" });
const photo = { format: "1:1", style: "studio", background: "clean" };
const startArgs = (n: number) => ({
  referenceImages: [file],
  photos: Array.from({ length: n }, () => photo),
  instructions: "",
});

afterEach(() => vi.restoreAllMocks());

describe("useBatchGeneration", () => {
  it("goes to out_of_credits on 403 with needed/available", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ code: "NO_CREDITS", needed: 3, available: 1 }), { status: 403 }),
    );
    const { result } = renderHook(() => useBatchGeneration({ pollIntervalMs: 20 }));
    await act(async () => { await result.current.start(startArgs(3)); });
    expect(result.current.state).toBe("out_of_credits");
    expect(result.current.needed).toBe(3);
    expect(result.current.available).toBe(1);
  });

  it("polls each pending id until every tile is done", async () => {
    const calls: Record<string, number> = { g1: 0, g2: 0 };
    vi.spyOn(global, "fetch").mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (init?.method === "POST") {
        return Promise.resolve(new Response(JSON.stringify({ ids: ["g1", "g2"] }), { status: 201 }));
      }
      if (url.endsWith("/g1")) {
        calls.g1 += 1;
        const body = calls.g1 >= 2
          ? { status: "completed", generatedImageUrl: "/m/g1", creditsRemaining: 2 }
          : { status: "pending" };
        return Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));
      }
      calls.g2 += 1;
      const body = calls.g2 >= 3
        ? { status: "completed", generatedImageUrl: "/m/g2", creditsRemaining: 2 }
        : { status: "pending" };
      return Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));
    });

    const { result } = renderHook(() => useBatchGeneration({ pollIntervalMs: 20 }));
    await act(async () => { await result.current.start(startArgs(2)); });
    await waitFor(() => expect(result.current.state).toBe("done"), { timeout: 3000 });
    expect(result.current.photos.filter((p) => p.status === "completed")).toHaveLength(2);
    expect(result.current.creditsRemaining).toBe(2);
  });

  it("caps polling and marks the remaining tiles failed", async () => {
    vi.spyOn(global, "fetch").mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === "POST") {
        return Promise.resolve(new Response(JSON.stringify({ ids: ["g1", "g2"] }), { status: 201 }));
      }
      return Promise.resolve(new Response(JSON.stringify({ status: "pending" }), { status: 200 }));
    });
    const { result } = renderHook(() => useBatchGeneration({ pollIntervalMs: 10, maxPollAttempts: 2 }));
    await act(async () => { await result.current.start(startArgs(2)); });
    await waitFor(() => expect(result.current.state).toBe("done"), { timeout: 2000 });
    expect(result.current.photos.every((p) => p.status === "failed")).toBe(true);
  });
});
