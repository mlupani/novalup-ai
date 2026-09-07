import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getCredits } from "@/lib/credits/service";
import { DashboardHeader } from "@/components/tool/DashboardHeader";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  if (!user) redirect("/login");
  const credits = await getCredits(user.id);

  return (
    <>
      <DashboardHeader name={user.name} email={user.email} credits={credits} />
      <main className="mx-auto max-w-3xl px-6 py-10">{children}</main>
    </>
  );
}
