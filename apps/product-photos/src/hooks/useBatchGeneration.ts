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
  // ~150 polls ≈ 5 min at the 2s default — matched to the server-side stale-pending
  // reap (STALE_MS in create.ts) so the client keeps polling right up to the point
  // the batch's rows would be reaped, then marks any still-pending tiles failed.
  const maxPollAttempts = opts?.maxPollAttempts ?? 150;

  const [state, setState] = useState<State>("idle");
  const [photos, setPhotos] = useState<PhotoStatus[]>([]);
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needed, setNeeded] = useState<number | null>(null);
  const [available, setAvailable] = useState<number | null>(null);

  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const attempts = useRef(0);
  const active = useRef(true);
  const inFlight = useRef(false);
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
    inFlight.current = false;
    timer.current = setInterval(async () => {
      // Skip this tick if the previous one is still awaiting its GETs — otherwise
      // an overlapping tick (each fires up to MAX_PHOTOS parallel polls, and a
      // completed poll downloads + stores a multi-MB image server-side) doubles
      // the request rate and, worse, lets the attempt-cap mark a tile "failed"
      // that an in-flight tick is about to resolve as completed-and-charged.
      if (!active.current || inFlight.current) return;
      inFlight.current = true;
      try {
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
      } finally {
        inFlight.current = false;
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
