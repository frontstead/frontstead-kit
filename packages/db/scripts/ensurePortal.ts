// Ensures this deployment's Portal row exists. `db:migrate` runs it right after
// `prisma migrate deploy`, so a fresh database serves the portal on its first
// deploy, with no seed to copy and no host shell.
//
// There is exactly one portal per deployment, compiled in from
// packages/portal-config/src/portal.config.ts, so the row is a deterministic
// consequence of config, like the schema:
//
//   no portal with the config slug, database has no portals → create Account + Portal
//   portal with the config slug exists                      → change nothing
//   no portal with the config slug, other portals exist     → warn, create nothing
//
// Create-only: after the first deploy the owner dashboard owns these fields,
// so a redeploy never overwrites an edit. It never creates users, passwords,
// listings or demo data; that is still the demo seeds' job, and they still
// refuse production.
import { pathToFileURL } from 'node:url';

export const GOING_LIVE_DOCS = 'docs/COMPOSE.md#going-live';

export interface EnsurePortalInput {
  slug: string;
  name: string;
  brokerageName: string;
  brokeragePhone: string;
  domains: string[];
}

export type EnsurePortalResult =
  | { status: 'created'; slug: string; name: string; customDomain: string | null }
  | { status: 'exists'; slug: string; isActive: boolean; suspended: boolean }
  | { status: 'slug-mismatch'; slug: string; existingSlugs: string[] };

// The subset of the Prisma client this needs, so tests can pass a fake.
export interface EnsurePortalDb {
  portal: {
    findUnique(args: { where: { slug: string }; select: { slug: true; isActive: true; suspendedAt: true } }): Promise<{ slug: string; isActive: boolean; suspendedAt: Date | null } | null>;
    findMany(args: { select: { slug: true }; orderBy: { createdAt: 'asc' }; take: number }): Promise<{ slug: string }[]>;
  };
  $transaction<T>(fn: (tx: EnsurePortalTx) => Promise<T>): Promise<T>;
}

export interface EnsurePortalTx {
  account: { create(args: { data: { name: string } }): Promise<{ id: string }> };
  portal: {
    create(args: {
      data: { slug: string; name: string; accountId: string; brokerageName: string; brokeragePhone: string; customDomain: string | null; isActive: boolean };
    }): Promise<unknown>;
  };
}

// The first configured domain a visitor would type: not localhost or a
// *.localhost development name.
export function primaryDomain(domains: string[]): string | null {
  return domains.find((domain) => domain !== 'localhost' && !domain.endsWith('.localhost')) ?? null;
}

async function findBySlug(db: EnsurePortalDb, slug: string): Promise<EnsurePortalResult | null> {
  const portal = await db.portal.findUnique({ where: { slug }, select: { slug: true, isActive: true, suspendedAt: true } });
  return portal ? { status: 'exists', slug, isActive: portal.isActive, suspended: portal.suspendedAt !== null } : null;
}

export async function ensurePortal(db: EnsurePortalDb, input: EnsurePortalInput): Promise<EnsurePortalResult> {
  const existing = await findBySlug(db, input.slug);
  if (existing) return existing;

  const others = await db.portal.findMany({ select: { slug: true }, orderBy: { createdAt: 'asc' }, take: 5 });
  if (others.length > 0) {
    return { status: 'slug-mismatch', slug: input.slug, existingSlugs: others.map((portal) => portal.slug) };
  }

  const customDomain = primaryDomain(input.domains);
  try {
    await db.$transaction(async (tx) => {
      const account = await tx.account.create({ data: { name: input.name } });
      await tx.portal.create({
        data: {
          slug: input.slug,
          name: input.name,
          accountId: account.id,
          brokerageName: input.brokerageName,
          brokeragePhone: input.brokeragePhone,
          customDomain,
          isActive: true,
        },
      });
    });
  } catch (error) {
    // Two migrate runs racing: the other one created it first.
    if ((error as { code?: string }).code === 'P2002') {
      const created = await findBySlug(db, input.slug);
      if (created) return created;
    }
    throw error;
  }
  return { status: 'created', slug: input.slug, name: input.name, customDomain };
}

export interface DescribeContext {
  listingMode: string;
  idxApproved: boolean;
  apiUrl?: string;
}

// What the migrate log shows: one line that says whether the portal is ready,
// then where to look next. `ok: false` lines are warnings; the portal's
// /api/health check is what fails the deploy.
export function describeEnsurePortal(result: EnsurePortalResult, context: DescribeContext): { ok: boolean; lines: string[] } {
  const listings = `listings: ${context.listingMode}${context.idxApproved ? '' : ' (MLS listings stay hidden until IDX approval)'}`;
  const readiness = context.apiUrl ? [`  check: ${context.apiUrl.replace(/\/$/, '')}/api/portals/slug/${result.slug}/readiness`] : [];

  switch (result.status) {
    case 'created':
      return {
        ok: true,
        lines: [`✓ Portal ${result.slug} ready (created): ${result.name} · ${result.customDomain ?? 'no custom domain'} · ${listings}`, ...readiness],
      };
    case 'exists':
      if (result.suspended) {
        return { ok: true, lines: [`! Portal ${result.slug} is suspended; visitors see the suspended notice. Nothing was changed.`] };
      }
      if (!result.isActive) {
        return {
          ok: false,
          lines: [`! Portal ${result.slug} exists but is inactive, so the site returns 404. Activate it, or see ${GOING_LIVE_DOCS}. Nothing was changed.`],
        };
      }
      return { ok: true, lines: [`✓ Portal ${result.slug} ready (existing, not changed) · ${listings}`, ...readiness] };
    case 'slug-mismatch':
      return {
        ok: false,
        lines: [
          `! portal.config.ts slug '${result.slug}' has no portal; this database has ${result.existingSlugs.map((slug) => `'${slug}'`).join(', ')}.`,
          `  Set the slug in packages/portal-config/src/portal.config.ts to match, or rename the portal deliberately (${GOING_LIVE_DOCS}). Nothing was created.`,
        ],
      };
  }
}

async function main(): Promise<void> {
  await import('./loadEnv.js');
  const { getPortalConfig } = await import('@frontstead/portal-config');
  const { prisma } = await import('../index.js');

  const config = getPortalConfig();
  try {
    const result = await ensurePortal(prisma as unknown as EnsurePortalDb, {
      slug: config.slug,
      name: config.name,
      brokerageName: config.compliance.brokerageName,
      brokeragePhone: config.compliance.brokeragePhone,
      domains: config.domains,
    });
    const { ok, lines } = describeEnsurePortal(result, {
      listingMode: config.listings.mode,
      idxApproved: config.compliance.idxApproved,
      apiUrl: process.env.API_URL,
    });
    for (const line of lines) (ok ? console.log : console.warn)(line);
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error('ensurePortal failed:', error);
    process.exit(1);
  });
}
