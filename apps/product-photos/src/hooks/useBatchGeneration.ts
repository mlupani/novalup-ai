"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import copy from "@/content/copy";

export type PhotoStatus =
  | { id: string; status: "pending" }
  | { id: string; status: "completed"; generatedImageUrl: string }
  | { id: string; status: "failed"; error: string };

type State = "idle" | "starting" | "generating" | "done" | "failed" | "out_of_credits";

export function useBatchGeneration(opts?: { pollIntervalMs?: number; maxPollAttempts?: number }) {
  const pollIntervalMs = opts?.pollIntervalMs ?? 2000;
  // ~90 polls ≈ 3 min at the 2s default — a batch still running past that has its
  // remaining pending tiles marked failed so the client stops polling forever.
  const maxPollAttempts = opts?.maxPollAttempts ?? 90;

  const [state, setState] = useState<State>("idle");
  const [photos, setPhotos] = useState<PhotoStatus[]>([]);
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needed, setNeeded] = useState<number | null>(null);
  const [available, setAvailable] = useState<number | null>(null);

  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const attempts = useRef(0);
  const active = useRef(true);
  const photosRef = useRef<PhotoStatus[]>([]);

  const stop = useCallback(() => {
    if (timer.current) { clearInterval(timer.current); timer.current = null; }
  }, []);

  const writePhotos = useCallback((next: PhotoStatus[]) => {
    photosRef.current = next;
    setPhotos(next);
  }, []);

  useEffect(() => {
    active.current = true;
    return () => { active.current = false; stop(); };
  }, [stop]);

  const reset = useCallback(() => {
    stop();
    setState("idle");
    writePhotos([]);
    setCreditsRemaining(null);
    setError(null);
    setNeeded(null);
    setAvailable(null);
  }, [stop, writePhotos]);

  const poll = useCallback(() => {
    attempts.current = 0;
    timer.current = setInterval(async () => {
      if (!active.current) return;
      attempts.current += 1;

      const pending = photosRef.current.filter((p) => p.status === "pending");

      if (attempts.current > maxPollAttempts) {
        stop();
        writePhotos(
          photosRef.current.map((p) =>
            p.status === "pending"
              ? { id: p.id, status: "failed" as const, error: copy.errors.generationFailed }
              : p,
          ),
        );
        setState("done");
        return;
      }
      if (pending.length === 0) {
        stop();
        setState("done");
        return;
      }

      const results = await Promise.all(
        pending.map(async (p) => {
          try {
            const res = await fetch(`/api/generations/${p.id}`);
            if (!res.ok) return null;
            return { id: p.id, body: (await res.json()) as Record<string, unknown> };
          } catch {
            return null;
          }
        }),
      );
      if (!active.current) return;

      let credits: number | null = null;
      const next = photosRef.current.map((p): PhotoStatus => {
        if (p.status !== "pending") return p;
        const hit = results.find((r) => r && r.id === p.id);
        if (!hit) return p;
        const b = hit.body;
        if (b.status === "completed") {
          if (typeof b.creditsRemaining === "number") credits = b.creditsRemaining;
          return { id: p.id, status: "completed", generatedImageUrl: String(b.generatedImageUrl) };
        }
        if (b.status === "failed") {
          return { id: p.id, status: "failed", error: copy.errors.generationFailed };
        }
        return p;
      });
      writePhotos(next);
      if (credits !== null) setCreditsRemaining(credits);
      if (!next.some((p) => p.status === "pending")) {
        stop();
        setState("done");
      }
    }, pollIntervalMs);
  }, [stop, writePhotos, pollIntervalMs, maxPollAttempts]);

  const start = useCallback(
    async (args: {
      referenceImages: File[];
      photos: { format: string; style: string; background: string }[];
      instructions: string;
    }) => {
      setState("starting");
      setError(null);
      writePhotos([]);
      setCreditsRemaining(null);
      setNeeded(null);
      setAvailable(null);

      const form = new FormData();
      for (const f of args.referenceImages) form.append("referenceImages", f);
      form.set("photos", JSON.stringify(args.photos));
      if (args.instructions.trim()) form.set("instructions", args.instructions.trim());

      let res: Response;
      try {
        res = await fetch("/api/generations", { method: "POST", body: form });
      } catch {
        setError(copy.errors.generic);
        setState("failed");
        return;
      }

      if (res.status === 403) {
        const b = (await res.json().catch(() => ({}))) as Record<string, unknown>;
        setNeeded(typeof b.needed === "number" ? b.needed : null);
        setAvailable(typeof b.available === "number" ? b.available : null);
        setState("out_of_credits");
        return;
      }
      if (res.status === 409) {
        setError(copy.errors.inProgress);
        setState("failed");
        return;
      }
      if (!res.ok) {
        setError(copy.errors.generic);
        setState("failed");
        return;
      }

      const { ids } = (await res.json()) as { ids: string[] };
      writePhotos(ids.map((id) => ({ id, status: "pending" as const })));
      setState("generating");
      poll();
    },
    [poll, writePhotos],
  );

  return { state, photos, creditsRemaining, error, needed, available, start, reset };
}
