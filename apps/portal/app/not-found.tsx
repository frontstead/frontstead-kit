import Link from "next/link";
import { Button } from "@frontstead/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <p className="text-xs font-semibold uppercase tracking-widest text-primary">ABC Realty</p>
      <h1 className="text-3xl font-black tracking-tight text-foreground">Page not found</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        That page isn&rsquo;t here. Head back home to explore golf communities in your area.
      </p>
      <Button asChild>
        <Link href="/">Back to home</Link>
      </Button>
    </main>
  );
}
