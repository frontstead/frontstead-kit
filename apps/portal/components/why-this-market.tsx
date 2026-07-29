const POINTS = [
  {
    title: "Golf-friendly weather",
    body: "A mild climate keeps courses playable most of the year, not just a few months.",
  },
  {
    title: "Different kinds of golf living",
    body: "Waterfront courses, in-town country clubs, and estate-lot communities — every kind of golf lifestyle in one market.",
  },
  {
    title: "Golf communities, not just golf listings",
    body: "HOA amenities, club dues, and course access — the details that matter beyond square footage.",
  },
  {
    title: "A real city nearby",
    body: "Restaurants, an airport, and a downtown within easy reach — not just a golf-only bubble.",
  },
];

// "Why this market" — the full-home lifestyle block (B0 spec). A structured
// value-prop grid, not a theatrical editorial section. Placeholder copy —
// replace with what's actually true of your own market.
export function WhyThisMarket() {
  return (
    <section className="border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Why this market
          </p>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            A metro built for golf living
          </h2>
          <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
            Year-round-playable weather, distinct kinds of golf community — and a real city
            behind all of them.
          </p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {POINTS.map((point) => (
            <div
              key={point.title}
              className="flex flex-col gap-2 rounded-md border border-border bg-card p-5"
            >
              <h3 className="text-sm font-bold tracking-tight text-foreground">{point.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{point.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
