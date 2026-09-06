interface SectionHeadingProps {
  eyebrow?: string;
  heading: string;
  subheading?: string;
  align?: "left" | "center";
}

export function SectionHeading({
  eyebrow,
  heading,
  subheading,
  align = "center",
}: SectionHeadingProps) {
  const alignClasses =
    align === "center"
      ? "text-center items-center mx-auto"
      : "text-left items-start";

  return (
    <div className={`flex max-w-3xl flex-col gap-4 ${alignClasses}`}>
      {eyebrow && (
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-light">
          {eyebrow}
        </span>
      )}
      <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-[2.75rem] md:leading-[1.1]">
        {heading}
      </h2>
      {subheading && (
        <p className="max-w-2xl text-base leading-relaxed text-neutral-400 md:text-lg">
          {subheading}
        </p>
      )}
    </div>
  );
}
