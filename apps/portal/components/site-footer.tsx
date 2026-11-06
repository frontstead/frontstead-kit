import { getPortalBrand } from "@/lib/brand";

const LINKS = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

// Compliance footer. This portal is its own licensed brokerage (single
// entity), so the attribution is to the brokerage itself plus the MLS IDX
// disclosure + equal housing. The brokerage name comes from the portal; the MLS
// board name below is a placeholder — replace it with your own board.
export async function SiteFooter() {
  const year = new Date().getFullYear();
  const brand = await getPortalBrand();
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-md">
            <p className="text-sm font-black tracking-tight text-foreground">{brand.name}</p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {brand.brokerageName} is a licensed real estate brokerage. Listing data is provided by your
              MLS board and is intended for consumers&rsquo; personal, non-commercial use.
            </p>
          </div>
          <nav className="flex flex-col gap-2 text-xs text-muted-foreground">
            {LINKS.map((link) => (
              <a key={link.href} href={link.href} className="transition-colors hover:text-foreground">
                {link.label}
              </a>
            ))}
          </nav>
        </div>
        <div className="mt-8 flex flex-col gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} {brand.brokerageName}. All rights reserved.</p>
          <p className="font-medium">Equal Housing Opportunity · Your MLS Board</p>
        </div>
      </div>
    </footer>
  );
}
