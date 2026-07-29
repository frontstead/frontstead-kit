import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@frontstead/ui/button";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageHero } from "@/components/page-hero";

export const metadata: Metadata = {
  title: "About | ABC Realty",
  description:
    "ABC Realty is a licensed real estate brokerage focused on golf-community homes.",
};

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-background">
        <PageHero
          eyebrow="About"
          title="ABC Realty"
          subtitle="Golf-community real estate in your market."
        />
        <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <p className="leading-relaxed text-muted-foreground">
            ABC Realty is a licensed real estate brokerage focused on one thing: helping
            buyers find the right home in a golf community. We cover the metro&rsquo;s distinct
            pockets of golf living — waterfront communities, in-town country clubs, and estate-lot
            neighborhoods across the region.
          </p>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Listings are drawn from your MLS board, the region&rsquo;s multiple listing
            service. We&rsquo;re finishing our MLS onboarding now; in the meantime, tell us what
            you&rsquo;re looking for and we&rsquo;ll reach out the moment matching homes are
            available.
          </p>
          <Button asChild className="mt-8">
            <Link href="/contact">Talk to an agent</Link>
          </Button>
        </article>
        <SiteFooter />
      </main>
    </>
  );
}
