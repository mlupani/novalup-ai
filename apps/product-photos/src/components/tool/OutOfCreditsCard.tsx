import { Card } from "@/components/ui/Card";
import { FeedbackForm } from "@/components/tool/FeedbackForm";
import copy from "@/content/copy";

export function OutOfCreditsCard({ name, email }: { name: string | null; email: string }) {
  return (
    <Card className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">{copy.outOfCredits.title}</h2>
        <p className="text-sm text-neutral-400">{copy.outOfCredits.body}</p>
      </div>
      <FeedbackForm defaultName={name ?? ""} defaultEmail={email} />
    </Card>
  );
}
