import Link from "next/link";
import { cn } from "@/lib/cn";

type Common = { variant?: "primary" | "outline" | "ghost"; size?: "md" | "lg"; className?: string };

const styles = {
  base: "inline-flex items-center justify-center rounded-full font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-light disabled:opacity-50 disabled:pointer-events-none",
  size: { md: "px-5 py-2.5 text-sm min-h-[44px]", lg: "px-7 py-3.5 text-base min-h-[52px]" },
  variant: {
    primary: "bg-gradient-to-r from-accent to-accent-dark text-white shadow-lg shadow-accent/20 hover:-translate-y-0.5 hover:shadow-accent/30",
    outline: "border border-white/20 text-white hover:bg-white/[0.06]",
    ghost: "text-neutral-300 hover:text-white hover:bg-white/[0.06]",
  },
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  href,
  ...props
}: Common & (React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: string })) {
  const cls = cn(styles.base, styles.size[size], styles.variant[variant], className);
  if (href) return <Link href={href} className={cls}>{props.children}</Link>;
  return <button className={cls} {...props} />;
}
