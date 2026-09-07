import Image from "next/image";
import copy from "@/content/copy";

export function BeforeAfter() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {([["before", copy.landing.demoBefore], ["after", copy.landing.demoAfter]] as const).map(([k, label]) => (
        <figure key={k} className="overflow-hidden rounded-2xl border border-white/[0.08]">
          <Image src={`/images/demo/${k}.jpg`} alt={label} width={640} height={640} className="h-full w-full object-cover" />
          <figcaption className="bg-night-card px-4 py-2 text-sm text-neutral-400">{label}</figcaption>
        </figure>
      ))}
    </div>
  );
}
