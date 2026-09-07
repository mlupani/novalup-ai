// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useGeneration } from "@/hooks/useGeneration";

const file = new File([new Uint8Array([1, 2, 3])], "p.png", { type: "image/png" });
const args = { image: file, format: "1:1", style: "studio", background: "clean", instructions: "" };

afterEach(() => vi.restoreAllMocks());

describe("useGeneration", () => {
  it("goes to out_of_credits on 403 NO_CREDITS", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ code: "NO_CREDITS" }), { status: 403 }),
    );
    const { result } = renderHook(() => useGeneration({ pollIntervalMs: 20 }));
    await act(async () => { await result.current.start(args); });
    expect(result.current.state).toBe("out_of_credits");
  });

  it("polls until completed", async () => {
    const fetchMock = vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "g1" }), { status: 201 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: "pending" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: "completed", generatedImageUrl: "/api/media/g1/generated", creditsRemaining: 2 }), { status: 200 }));
    const { result } = renderHook(() => useGeneration({ pollIntervalMs: 20 }));
    await act(async () => { await result.current.start(args); });
    await waitFor(() => expect(result.current.state).toBe("completed"), { timeout: 2000 });
    expect(result.current.result).toEqual({ generatedImageUrl: "/api/media/g1/generated", creditsRemaining: 2 });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
