import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { ProductPhotoTool } from "@/components/tool/ProductPhotoTool";

export default async function AppPage() {
  const sessionUser = await requireUser();
  if (!sessionUser) redirect("/login");

  // Layout and page render in parallel, so this path is also reachable with a
  // stale cookie — use a safe lookup, never `findUniqueOrThrow` (see layout.tsx).
  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { name: true, email: true, credits: true },
  });
  if (!user) redirect("/api/auth/signout?callbackUrl=/login");

  return <ProductPhotoTool initialCredits={user.credits} user={{ name: user.name, email: user.email }} />;
}
