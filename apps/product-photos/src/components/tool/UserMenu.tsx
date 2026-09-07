"use client";
import { useState } from "react";
import { signOut } from "next-auth/react";
import copy from "@/content/copy";

export function UserMenu({ name, email }: { name: string | null; email: string }) {
  const [open, setOpen] = useState(false);
  const initial = (name ?? email).charAt(0).toUpperCase();
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20 text-sm font-semibold text-white"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {initial}
      </button>
      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-56 rounded-xl border border-white/10 bg-night-card p-3 text-sm shadow-xl">
          <p className="truncate font-medium text-white">{name ?? email}</p>
          <p className="truncate text-neutral-400">{email}</p>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="mt-3 w-full rounded-lg px-3 py-2 text-left text-neutral-300 hover:bg-white/[0.06]"
          >
            {copy.auth.signOut}
          </button>
        </div>
      )}
    </div>
  );
}
