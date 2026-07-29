import Link from 'next/link';
import { Button } from '@frontstead/ui/button';
import { SiteHeader } from './site-header';
import { SiteFooter } from './site-footer';
import { PropertyCard } from './property-card';
import type { LandingResult } from '@/lib/landings';
export function ListingLanding({ landing, kind }: { landing: LandingResult; kind: 'area' | 'collection' }) {
  const attribution = kind === 'area' ? `area=${landing.metadata.slug}` : `collection=${landing.metadata.slug}`;
  return <><SiteHeader /><main className="min-h-screen bg-background"><section className="border-b border-border bg-card"><div className="mx-auto max-w-6xl px-4 py-12 sm:px-6"><p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{kind}</p><h1 className="mt-2 text-3xl font-bold tracking-tight">{landing.metadata.name}</h1>{landing.metadata.description ? <p className="mt-3 max-w-2xl text-muted-foreground">{landing.metadata.description}</p> : null}<Button asChild className="mt-5"><Link href={`/contact?${attribution}`}>Ask about this {kind}</Link></Button></div></section><section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">{landing.gated ? <div className="rounded-md border border-border bg-card p-6"><h2 className="font-bold">Listings are not available yet</h2><p className="mt-2 text-sm text-muted-foreground">This page is ready, but public MLS display is currently gated.</p></div> : landing.properties.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{landing.properties.map((property) => <PropertyCard key={property.id} property={property} />)}</div> : <div className="rounded-md border border-dashed border-border p-8 text-center"><h2 className="font-bold">No matching homes right now</h2><p className="mt-2 text-sm text-muted-foreground">Inventory changes often. Ask an agent to watch this page for you.</p></div>}</section></main><SiteFooter /></>;
}
