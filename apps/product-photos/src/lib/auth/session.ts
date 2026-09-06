import { auth } from "@/lib/auth/auth";

/**
 * Resolves the current authenticated user from the Auth.js session.
 *
 * Returns `null` when there is no session so callers can decide how to react
 * (API routes answer 401, server components redirect to `/login`).
 */
export async function requireUser(): Promise<
  { id: string; email: string; name: string | null } | null
> {
  const session = await auth();
  if (!session?.user?.id) return null;

  return {
    id: session.user.id,
    email: session.user.email ?? "",
    name: session.user.name ?? null,
  };
}
