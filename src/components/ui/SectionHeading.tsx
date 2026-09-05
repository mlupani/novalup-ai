interface SectionHeadingProps {
  eyebrow?: string;
  heading: string;
  subheading?: string;
  align?: "left" | "center";
  tone?: "light" | "dark";
}

export function SectionHeading({
  eyebrow,
  heading,
  subheading,
  align = "center",
  tone = "light",
}: SectionHeadingProps) {
  const alignClasses =
    align === "center" ? "text-center items-center" : "text-left items-start";
  const headingColor = tone === "dark" ? "text-white" : "text-ink";
  const subColor = tone === "dark" ? "text-neutral-400" : "text-neutral-500";

  return (
    <div className={`flex flex-col gap-4 ${alignClasses}`}>
      {eyebrow && (
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          {eyebrow}
        </span>
      )}
      <h2
        className={`text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl ${headingColor}`}
      >
        {heading}
      </h2>
      {subheading && (
        <p className={`max-w-2xl text-lg ${subColor}`}>{subheading}</p>
      )}
    </div>
  );
}
