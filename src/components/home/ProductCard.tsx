import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { Product } from "@/data/products";
import { TOOL_PREVIEWS } from "@/components/home/ToolPreviews";

export function ProductCard({
  product,
  featured = false,
}: {
  product: Product;
  featured?: boolean;
}) {
  const t = useTranslations("products");
  const Icon = product.icon;
  const Preview = TOOL_PREVIEWS[product.slug];
  const isAvailable = product.status === "available";

  const header = (
    <div className="flex items-center justify-between gap-3">
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
          isAvailable
            ? "border-accent/25 bg-accent/10 text-accent-light"
            : "border-white/[0.08] bg-white/[0.03] text-neutral-400"
        }`}
      >
        <Icon size={18} strokeWidth={1.75} />
      </span>
      <span
        className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${
          isAvailable
            ? "border-accent/25 bg-accent/10 text-accent-light"
            : "border-white/[0.08] bg-white/[0.03] text-neutral-400"
        }`}
      >
        {isAvailable ? t("statusAvailable") : t("statusComingSoon")}
      </span>
    </div>
  );

  const copy = (
    <div className="flex flex-col gap-2">
      <h3 className="text-lg font-semibold tracking-tight text-white">
        {t(`items.${product.slug}.name`)}
      </h3>
      <p className="text-sm leading-relaxed text-neutral-400">
        {t(`items.${product.slug}.description`)}
      </p>
    </div>
  );

  const cta = (
    <span
      className={`flex items-center gap-1.5 text-sm font-semibold ${
        isAvailable ? "text-accent-light" : "text-neutral-400"
      }`}
    >
      {t(`items.${product.slug}.cta`)}
      <ArrowRight
        size={15}
        className="transition-transform duration-200 group-hover:translate-x-1"
      />
    </span>
  );

  const preview = Preview ? (
    <Preview className={isAvailable ? "" : "opacity-70"} />
  ) : null;

  const stretchedPreview = Preview ? <Preview stretch /> : null;

  const cardClasses = `group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-night-card transition-all duration-300 hover:-translate-y-1 ${
    isAvailable
      ? "border-accent/20 hover:border-accent/45"
      : "border-white/[0.07] hover:border-white/[0.16]"
  }`;

  const glow = (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 h-48 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      style={{
        background:
          "radial-gradient(70% 100% at 50% 0%, rgba(225,29,72,0.12), transparent 70%)",
      }}
    />
  );

  if (featured) {
    return (
      <Link href={product.href} className={`${cardClasses} p-6 md:p-8`}>
        {glow}
        <div className="relative z-10 flex flex-1 flex-col justify-center gap-6 lg:flex-row lg:items-stretch lg:gap-10">
          <div className="flex flex-col justify-center gap-5 lg:flex-1">
            {header}
            {copy}
            {cta}
          </div>
          <div aria-hidden="true" className="w-full lg:w-1/2">
            <span className="block lg:hidden">{preview}</span>
            <span className="hidden h-full lg:block">{stretchedPreview}</span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={product.href} className={`${cardClasses} gap-5 p-6`}>
      {glow}
      <div className="relative z-10">{header}</div>
      <div aria-hidden="true" className="relative z-10">
        {preview}
      </div>
      <div className="relative z-10">{copy}</div>
      <div className="relative z-10 mt-auto pt-1">{cta}</div>
    </Link>
  );
}
