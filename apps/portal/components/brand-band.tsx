import { Badge } from "@frontstead/ui/badge";

const SUB_AREAS = ["Lake Norman", "South Charlotte", "Union County", "Fort Mill SC"] as const;

// Structured first viewport (per DESIGN.md) — a bordered, flat fairway-green band
// that leads with real structure (wordmark + value prop + the four markets), not a
// theatrical photo hero.
export function BrandBand() {
  return (
    <section className="border-b border-border bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.4fr_1fr] lg:items-end lg:py-20">
        <div className="flex flex-col gap-5">
          <Badge className="w-fit border border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground">
            Now forming · listings coming soon
          </Badge>
          <h1 className="max-w-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-light.svg"
              alt="ABC Realty"
              className="w-64 max-w-full sm:w-80 lg:w-[26rem]"
            />
          </h1>
          <p className="max-w-xl text-base text-primary-foreground/80 sm:text-lg">
            Homes in your area&rsquo;s golf communities — curated by neighborhood, one
            brokerage covering every fairway.
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-primary-foreground/25 bg-primary-foreground/25">
          {SUB_AREAS.map((area) => (
            <div key={area} className="bg-primary px-4 py-5">
              <dt className="text-[11px] font-semibold uppercase tracking-widest text-primary-foreground/60">
                Market
              </dt>
              <dd className="mt-1 text-sm font-semibold">{area}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
