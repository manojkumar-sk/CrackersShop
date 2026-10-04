type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description: string;
  level?: "h1" | "h2";
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  level = "h2",
}: SectionHeadingProps) {
  const HeadingTag = level;

  return (
    <div className="max-w-2xl">
      <p className="text-xs font-medium tracking-[0.16em] text-accent-strong uppercase">
        {eyebrow}
      </p>
      <HeadingTag className="mt-2 font-display text-3xl leading-tight tracking-tight text-balance text-ink sm:text-4xl">
        {title}
      </HeadingTag>
      <p className="mt-3 text-base leading-7 text-muted">{description}</p>
    </div>
  );
}
