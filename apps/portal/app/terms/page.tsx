import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageHero } from "@/components/page-hero";

export const metadata: Metadata = {
  title: "Terms | ABC Realty",
  description: "Terms of use for the ABC Realty website.",
};

export default function TermsPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-background">
        <PageHero eyebrow="Legal" title="Terms of Use" />
        <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <p className="leading-relaxed text-muted-foreground">
            Our full terms of use are being finalized ahead of launch. ABC Realty is a
            licensed real estate brokerage. Listing data shown on this site is provided by your
            MLS board and is intended for consumers&rsquo; personal, non-commercial use; it may not be
            reproduced or redistributed.
          </p>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Questions in the meantime?{" "}
            <Link href="/contact" className="font-medium text-primary hover:underline">
              Get in touch
            </Link>
            .
          </p>
        </article>
        <SiteFooter />
      </main>
    </>
  );
}
