import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { DashboardHeader } from "@/components/tool/DashboardHeader";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const sessionUser = await requireUser();
  if (!sessionUser) redirect("/login");

  // A JWT session can outlive its User row (e.g. `docker compose down -v`, or a
  // rotated secret). A plain `findUnique` (not `findUniqueOrThrow`) lets us catch
  // that here and bounce through sign-out, which clears the cookie AND breaks the
  // middleware redirect loop that a bare `redirect("/login")` would cause.
  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { name: true, email: true, credits: true },
  });
  if (!user) redirect("/api/auth/signout?callbackUrl=/login");

  return (
    <>
      <DashboardHeader name={user.name} email={user.email} credits={user.credits} />
      <main className="mx-auto max-w-3xl px-6 py-10">{children}</main>
    </>
  );
}
