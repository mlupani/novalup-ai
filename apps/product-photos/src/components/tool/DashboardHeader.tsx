import { UserMenu } from "@/components/tool/UserMenu";
import { FREE_CREDITS } from "@/lib/credits/config";
import copy from "@/content/copy";

export function DashboardHeader({
  name, email, credits, onMyCreations,
}: {
  name: string | null; email: string; credits: number;
  onMyCreations?: () => void;
}) {
  const label = credits === FREE_CREDITS ? copy.credits.freeLabel(credits) : copy.credits.remainingLabel(credits);
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-night/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <span className="font-bold tracking-tight">{copy.brand.name}</span>
        <div className="flex items-center gap-4">
          <span className="rounded-full border border-white/12 px-3 py-1.5 text-sm text-neutral-300">{label}</span>
          <UserMenu name={name} email={email} onMyCreations={onMyCreations} />
        </div>
      </div>
    </header>
  );
}
