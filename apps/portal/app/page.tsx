import { SiteHeader } from "@/components/site-header";
import { BrandBand } from "@/components/brand-band";
import { CommunitiesGrid } from "@/components/communities-grid";
import { WhyThisMarket } from "@/components/why-this-market";
import { InquiryForm } from "@/components/inquiry-form";
import { SiteFooter } from "@/components/site-footer";
import { getCommunities } from "@/lib/communities";

// Coming-soon home (v1 launch state). Live listings are gated behind MLS IDX
// approval, so the page leads with communities + lead capture. The full home
// (featured listings, lifestyle block) and per-community guides land in B2.
export default function HomePage() {
  const communityNames = getCommunities().map((c) => c.name);
  return (
    <>
      <SiteHeader />
      <main className="bg-background">
        <BrandBand />

        <section id="communities" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-14 sm:px-6">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Communities</p>
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Golf neighborhoods in your area
            </h2>
            <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
              We&rsquo;re building dedicated guides and live listings for each community. Tell us
              where you&rsquo;re looking and we&rsquo;ll reach out the moment homes are available.
            </p>
          </div>
          <div className="mt-8">
            <CommunitiesGrid />
          </div>
        </section>

        <WhyThisMarket />

        <section id="inquiry" className="scroll-mt-20 border-t border-border bg-secondary/40">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_1.2fr] lg:items-start">
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">Get on the list</p>
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Talk to an ABC Realty agent
              </h2>
              <p className="max-w-md text-sm text-muted-foreground sm:text-base">
                Listings go live as soon as our MLS access is approved. Tell us what you&rsquo;re
                after and you&rsquo;ll be first to know.
              </p>
            </div>
            <div className="rounded-md border border-border bg-card p-6">
              <InquiryForm communities={communityNames} />
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
