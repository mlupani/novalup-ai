"use client";
import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import copy from "@/content/copy";

export function UserMenu({
  name,
  email,
  onMyCreations,
}: {
  name: string | null;
  email: string;
  onMyCreations?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const initial = (name ?? email).charAt(0).toUpperCase();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20 text-sm font-semibold text-white"
        aria-label={copy.tool.userMenuLabel}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {initial}
      </button>
      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-56 rounded-xl border border-white/10 bg-night-card p-3 text-sm shadow-xl">
          <p className="truncate font-medium text-white">{name ?? email}</p>
          <p className="truncate text-neutral-400">{email}</p>
          {onMyCreations && (
            <button
              onClick={() => { setOpen(false); onMyCreations(); }}
              className="mt-2 w-full rounded-lg px-3 py-2 text-left text-neutral-300 hover:bg-white/[0.06]"
              role="menuitem"
            >
              {copy.tool.myCreations}
            </button>
          )}
          <button
            onClick={() => { setOpen(false); signOut({ callbackUrl: "/" }); }}
            className="mt-3 w-full rounded-lg px-3 py-2 text-left text-neutral-300 hover:bg-white/[0.06]"
            role="menuitem"
          >
            {copy.auth.signOut}
          </button>
        </div>
      )}
    </div>
  );
}
