import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { AppClient } from "./page";

export default async function AppLayout() {
  const sessionUser = await requireUser();
  if (!sessionUser) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { name: true, email: true, credits: true },
  });
  if (!user) redirect("/api/auth/signout?callbackUrl=/login");

  return (
    <>
      <AppClient initialCredits={user.credits} user={{ name: user.name, email: user.email }} />
    </>
  );
}
