import { Link } from "@/i18n/navigation";

type Variant = "primary" | "secondary" | "ghost" | "text";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-night";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-accent text-white shadow-[0_8px_28px_-10px_rgba(225,29,72,0.8)] hover:bg-accent-dark hover:shadow-[0_12px_32px_-8px_rgba(225,29,72,0.9)] hover:-translate-y-0.5",
  secondary:
    "border border-white/15 bg-white/[0.03] text-white hover:border-white/30 hover:bg-white/[0.06] hover:-translate-y-0.5",
  ghost: "text-neutral-300 hover:text-white",
  text: "px-0 py-0 text-white underline-offset-4 hover:underline",
};

interface ButtonProps {
  variant?: Variant;
  href?: string;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
}

export function Button({
  variant = "primary",
  href,
  className = "",
  children,
  onClick,
  type = "button",
}: ButtonProps) {
  const classes = `${BASE} ${VARIANTS[variant]} ${className}`;

  if (href?.startsWith("#")) {
    return (
      <a href={href} onClick={onClick} className={classes}>
        {children}
      </a>
    );
  }

  if (href) {
    return (
      <Link href={href} onClick={onClick} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} className={classes}>
      {children}
    </button>
  );
}
