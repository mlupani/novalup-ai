import { Card } from "@/components/ui/Card";
import { FeedbackForm } from "@/components/tool/FeedbackForm";
import copy from "@/content/copy";

export function OutOfCreditsCard() {
  return (
    <Card className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">{copy.outOfCredits.title}</h2>
        <p className="text-sm text-neutral-400">{copy.outOfCredits.body}</p>
      </div>
      <FeedbackForm />
    </Card>
  );
}
