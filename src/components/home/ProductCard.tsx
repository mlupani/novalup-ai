import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Product } from "@/data/products";

export function ProductCard({ product }: { product: Product }) {
  const t = useTranslations("products");
  const Icon = product.icon;
  const isAvailable = product.status === "available";

  return (
    <Link
      href={product.href}
      className="group flex flex-col gap-5 rounded-2xl border border-neutral-200 bg-white p-7 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_16px_32px_-16px_rgba(0,0,0,0.15)]"
    >
      <div className="flex items-center justify-between">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-paper-alt text-ink">
          <Icon size={20} strokeWidth={1.75} />
        </span>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            isAvailable
              ? "bg-accent-light/20 text-accent-dark"
              : "bg-neutral-100 text-neutral-500"
          }`}
        >
          {isAvailable ? t("statusAvailable") : t("statusComingSoon")}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-semibold text-ink">
          {t(`items.${product.slug}.name`)}
        </h3>
        <p className="text-sm leading-relaxed text-neutral-500">
          {t(`items.${product.slug}.description`)}
        </p>
      </div>

      <span className="mt-auto flex items-center gap-1 text-sm font-semibold text-accent transition-transform group-hover:translate-x-1">
        {t(`items.${product.slug}.cta`)} →
      </span>
    </Link>
  );
}
