// Shared green band hero for the simple content pages (about, contact, legal).
export function PageHero({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <section className="border-b border-border bg-primary text-primary-foreground">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-widest text-primary-foreground/60">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>
        {subtitle ? <p className="mt-3 text-primary-foreground/80">{subtitle}</p> : null}
      </div>
    </section>
  );
}
