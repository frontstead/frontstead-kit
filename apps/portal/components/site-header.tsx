import { Button } from "@frontstead/ui/button";
import { getSessionUser } from "@/lib/session-user-server";
import { LogoutButton } from "@/components/logout-button";
import { MobileNav } from "@/components/mobile-nav";

const NAV = [
  { href: "/properties", label: "Properties" },
  { href: "/communities", label: "Communities" },
  { href: "/contact", label: "Contact" },
];

const navLinkClass =
  "hidden rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex";

export async function SiteHeader() {
  const user = await getSessionUser();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="flex w-full items-center justify-between gap-4 px-3 py-3 sm:px-4 lg:px-6">
        <a href="/" className="flex shrink-0 items-center" aria-label="ABC Realty home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="ABC Realty" className="h-7 w-auto sm:h-8" />
        </a>
        <nav className="flex min-w-0 flex-1 items-center justify-end gap-1 sm:gap-2">
          {NAV.map((item) => (
            <a key={item.href} href={item.href} className={navLinkClass}>
              {item.label}
            </a>
          ))}
          {user ? (
            <>
              <a href="/favorites" className={navLinkClass}>
                Favorites
              </a>
              <LogoutButton />
            </>
          ) : (
            <a href="/login" className={navLinkClass}>
              Log in
            </a>
          )}
          <Button asChild size="sm">
            <a href="/contact">Talk to an agent</a>
          </Button>
          <MobileNav isAuthed={Boolean(user)} />
        </nav>
      </div>
    </header>
  );
}
