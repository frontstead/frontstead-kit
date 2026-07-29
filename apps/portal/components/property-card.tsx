import Link from "next/link";
import type { PortalPropertySummary } from "@/lib/listings";

function formatPrice(price: number | null): string | null {
  if (price == null) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

export function PropertyCard({ property }: { property: PortalPropertySummary }) {
  const price = formatPrice(property.price);
  const hasFacts = property.bedrooms != null || property.bathrooms != null || property.squareFeet != null;

  return (
    <Link
      href={`/properties/${property.slug ?? property.id}`}
      className="flex flex-col gap-3 rounded-md border border-border bg-card p-5 transition-colors hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="aspect-[4/3] w-full overflow-hidden rounded-sm border border-border bg-secondary/40">
        {property.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={property.imageUrl}
            alt={property.address}
            className="h-full w-full object-cover"
          />
        ) : null}
      </div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold tracking-tight text-foreground">{property.address}</h3>
          <p className="text-sm text-muted-foreground">
            {property.city}, {property.state} {property.zipCode}
          </p>
        </div>
        {price ? <span className="shrink-0 text-sm font-semibold text-foreground">{price}</span> : null}
      </div>
      {hasFacts ? (
        <p className="text-sm text-muted-foreground">
          {property.bedrooms != null ? `${property.bedrooms} bd` : null}
          {property.bedrooms != null && property.bathrooms != null ? " · " : null}
          {property.bathrooms != null ? `${property.bathrooms} ba` : null}
          {(property.bedrooms != null || property.bathrooms != null) && property.squareFeet != null ? " · " : null}
          {property.squareFeet != null ? `${property.squareFeet.toLocaleString()} sqft` : null}
        </p>
      ) : null}
    </Link>
  );
}
