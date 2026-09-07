"use client";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import copy from "@/content/copy";

export function GoogleButton() {
  return (
    <Button type="button" variant="outline" className="w-full" onClick={() => signIn("google", { callbackUrl: "/app" })}>
      {copy.auth.google}
    </Button>
  );
}
