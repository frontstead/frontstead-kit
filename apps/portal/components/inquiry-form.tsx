"use client";

import { useActionState } from "react";
import { Button } from "@frontstead/ui/button";
import { Input } from "@frontstead/ui/input";
import { Label } from "@frontstead/ui/label";
import { Textarea } from "@frontstead/ui/textarea";
import { FormMessage } from "@frontstead/ui/form-message";
import { submitInquiry, type InquiryResult } from "@/app/actions";

export function InquiryForm({ communities, areaSlug, collectionSlug }: { communities: string[]; areaSlug?: string; collectionSlug?: string }) {
  const [state, action, pending] = useActionState<InquiryResult | null, FormData>(
    submitInquiry,
    null,
  );

  if (state?.ok) {
    return (
      <div className="rounded-md border border-border bg-card p-6">
        <p className="text-sm font-semibold text-foreground">Thanks — we&rsquo;ll be in touch.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          An ABC Realty agent will reach out as soon as listings go live in your community.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      {areaSlug ? <input type="hidden" name="areaSlug" value={areaSlug} /> : null}
      {collectionSlug ? <input type="hidden" name="collectionSlug" value={collectionSlug} /> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required autoComplete="name" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="phone">
            Phone <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input id="phone" name="phone" type="tel" autoComplete="tel" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="community">
            Community <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input id="community" name="community" list="portal-communities" placeholder="e.g. The Peninsula" />
          <datalist id="portal-communities">
            {communities.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="message">
          What are you looking for? <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Textarea id="message" name="message" rows={4} placeholder="Price range, timeline, must-haves…" />
      </div>
      {state && !state.ok ? <FormMessage variant="error">{state.error}</FormMessage> : null}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" loading={pending} loadingLabel="Sending…">Request a callback</Button>
        <p className="text-xs text-muted-foreground">We&rsquo;ll only use this to talk homes. No spam.</p>
      </div>
    </form>
  );
}
