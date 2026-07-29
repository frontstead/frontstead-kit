import Link from "next/link";
import { getCommunities, type CommunityFrontmatter } from "@/lib/communities";

function CommunityCard({ community }: { community: CommunityFrontmatter }) {
  return (
    <Link
      href={`/communities/${community.slug}`}
      className="group flex flex-col gap-3 rounded-md border border-border bg-card p-5 transition-colors hover:border-primary/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold tracking-tight text-foreground">{community.name}</h3>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {community.subArea}
          </p>
        </div>
        {community.priceRange ? (
          <span className="shrink-0 text-xs font-semibold text-muted-foreground">
            {community.priceRange}
          </span>
        ) : null}
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">{community.summary}</p>
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        {community.golfClubs.map((club) => (
          <span
            key={club}
            className="rounded border border-border bg-accent px-2 py-0.5 text-[11px] font-medium text-accent-foreground"
          >
            {club}
          </span>
        ))}
      </div>
      <span className="mt-auto pt-1 text-xs font-semibold text-primary group-hover:underline">
        View guide →
      </span>
    </Link>
  );
}

export function CommunitiesGrid() {
  const communities = getCommunities();
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {communities.map((community) => (
        <CommunityCard key={community.slug} community={community} />
      ))}
    </div>
  );
}
