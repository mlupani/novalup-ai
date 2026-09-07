"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import copy from "@/content/copy";

type State = "idle" | "starting" | "generating" | "completed" | "failed" | "out_of_credits";
type Result = { generatedImageUrl: string; creditsRemaining: number };

export function useGeneration(opts?: { pollIntervalMs?: number }) {
  const pollIntervalMs = opts?.pollIntervalMs ?? 2000;
  const [state, setState] = useState<State>("idle");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const active = useRef(true);

  const stop = useCallback(() => {
    if (timer.current) { clearInterval(timer.current); timer.current = null; }
  }, []);

  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      stop();
    };
  }, [stop]);

  const reset = useCallback(() => {
    stop();
    setState("idle");
    setResult(null);
    setError(null);
  }, [stop]);

  const poll = useCallback((id: string) => {
    timer.current = setInterval(async () => {
      const res = await fetch(`/api/generations/${id}`);
      if (!active.current) return;
      if (!res.ok) return;
      const body = await res.json();
      if (body.status === "completed") {
        stop();
        setResult({ generatedImageUrl: body.generatedImageUrl, creditsRemaining: body.creditsRemaining });
        setState("completed");
      } else if (body.status === "failed") {
        stop();
        setError(copy.errors.generationFailed);
        setState("failed");
      }
    }, pollIntervalMs);
  }, [stop, pollIntervalMs]);

  const start = useCallback(async (args: {
    image: File; format: string; style: string; background: string; instructions: string;
  }) => {
    setState("starting");
    setError(null);
    setResult(null);
    const form = new FormData();
    form.set("image", args.image);
    form.set("format", args.format);
    form.set("style", args.style);
    form.set("background", args.background);
    if (args.instructions.trim()) form.set("instructions", args.instructions.trim());

    const res = await fetch("/api/generations", { method: "POST", body: form });
    if (res.status === 403) { setState("out_of_credits"); return; }
    if (res.status === 409) { setError(copy.errors.inProgress); setState("failed"); return; }
    if (!res.ok) { setError(copy.errors.generic); setState("failed"); return; }
    const { id } = await res.json();
    setState("generating");
    poll(id);
  }, [poll]);

  return { state, result, error, start, reset };
}
