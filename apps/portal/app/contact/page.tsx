import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageHero } from "@/components/page-hero";
import { InquiryForm } from "@/components/inquiry-form";
import { getCommunities } from "@/lib/communities";

export const metadata: Metadata = {
  title: "Contact | ABC Realty",
  description:
    "Tell us what you're looking for and an ABC Realty agent will be in touch.",
};

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ area?: string; collection?: string }> }) {
  const attribution = await searchParams;
  const communityNames = getCommunities().map((c) => c.name);
  return (
    <>
      <SiteHeader />
      <main className="bg-background">
        <PageHero
          eyebrow="Contact"
          title="Talk to an agent"
          subtitle="Tell us what you're looking for and we'll be in touch — usually within a day."
        />
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <div className="rounded-md border border-border bg-card p-6">
            <InquiryForm communities={communityNames} areaSlug={attribution.area} collectionSlug={attribution.collection} />
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            ABC Realty is a licensed real estate brokerage.
          </p>
        </div>
        <SiteFooter />
      </main>
    </>
  );
}
