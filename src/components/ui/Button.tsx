import { Link } from "@/i18n/navigation";

type Variant = "primary" | "secondary" | "secondary-dark" | "text";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all duration-200 ease-out";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-gradient-to-br from-accent to-accent-dark text-white shadow-[0_8px_24px_-8px_rgba(225,29,72,0.5)] hover:shadow-[0_10px_28px_-6px_rgba(225,29,72,0.6)] hover:-translate-y-0.5",
  secondary:
    "border border-neutral-300 text-ink hover:border-ink hover:-translate-y-0.5",
  "secondary-dark":
    "border border-white/30 text-white hover:border-white hover:-translate-y-0.5",
  text: "px-0 py-0 text-ink underline-offset-4 hover:underline",
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
