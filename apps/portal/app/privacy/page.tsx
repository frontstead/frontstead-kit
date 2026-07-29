import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageHero } from "@/components/page-hero";

export const metadata: Metadata = {
  title: "Privacy | ABC Realty",
  description: "How ABC Realty handles the information you share.",
};

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-background">
        <PageHero eyebrow="Legal" title="Privacy" />
        <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <p className="leading-relaxed text-muted-foreground">
            Our full privacy policy is being finalized ahead of launch. In plain terms: the only
            information we collect is what you choose to share through our inquiry form — your name,
            contact details, and what you&rsquo;re looking for in a home. We use it solely to connect
            you with an ABC Realty agent, and we do not sell your information.
          </p>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Questions about your data in the meantime?{" "}
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
