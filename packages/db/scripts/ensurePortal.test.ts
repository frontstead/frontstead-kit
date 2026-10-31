import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { describeEnsurePortal, ensurePortal, primaryDomain, type EnsurePortalDb } from './ensurePortal.js';

const input = {
  slug: 'smith-realty',
  name: 'Smith Realty',
  brokerageName: 'Smith Realty LLC',
  brokeragePhone: '(704) 555-0199',
  domains: ['smith-realty.localhost', 'smithrealty.com', 'localhost'],
};

type Row = { slug: string; isActive: boolean; suspendedAt: Date | null };

function fakeDb(rows: Row[] = [], { raceOnCreate = false } = {}) {
  const created = { accounts: [] as { name: string }[], portals: [] as Record<string, unknown>[] };
  const db: EnsurePortalDb = {
    portal: {
      findUnique: async ({ where }) => rows.find((row) => row.slug === where.slug) ?? null,
      findMany: async ({ take }) => rows.slice(0, take).map(({ slug }) => ({ slug })),
    },
    $transaction: async (fn) => {
      if (raceOnCreate) {
        rows.push({ slug: input.slug, isActive: true, suspendedAt: null });
        throw Object.assign(new Error('Unique constraint failed'), { code: 'P2002' });
      }
      return fn({
        account: { create: async ({ data }) => (created.accounts.push(data), { id: 'acct_1' }) },
        portal: { create: async ({ data }) => (created.portals.push(data), data) },
      });
    },
  };
  return { db, created };
}

describe('ensurePortal', () => {
  it('creates one Account and one active Portal from config in an empty database', async () => {
    const { db, created } = fakeDb();
    const result = await ensurePortal(db, input);
    assert.deepEqual(result, { status: 'created', slug: 'smith-realty', name: 'Smith Realty', customDomain: 'smithrealty.com' });
    assert.deepEqual(created.accounts, [{ name: 'Smith Realty' }]);
    assert.deepEqual(created.portals, [{
      slug: 'smith-realty',
      name: 'Smith Realty',
      accountId: 'acct_1',
      brokerageName: 'Smith Realty LLC',
      brokeragePhone: '(704) 555-0199',
      customDomain: 'smithrealty.com',
      isActive: true,
    }]);
  });

  it('changes nothing when the portal already exists', async () => {
    const { db, created } = fakeDb([{ slug: 'smith-realty', isActive: true, suspendedAt: null }]);
    assert.deepEqual(await ensurePortal(db, input), { status: 'exists', slug: 'smith-realty', isActive: true, suspended: false });
    assert.equal(created.accounts.length + created.portals.length, 0);
  });

  it('reports an inactive or suspended portal without touching it', async () => {
    const inactive = fakeDb([{ slug: 'smith-realty', isActive: false, suspendedAt: null }]);
    assert.deepEqual(await ensurePortal(inactive.db, input), { status: 'exists', slug: 'smith-realty', isActive: false, suspended: false });
    const suspended = fakeDb([{ slug: 'smith-realty', isActive: true, suspendedAt: new Date() }]);
    assert.equal((await ensurePortal(suspended.db, input) as { suspended: boolean }).suspended, true);
  });

  it('creates nothing when the database holds a portal with a different slug', async () => {
    const { db, created } = fakeDb([{ slug: 'abc-realty', isActive: true, suspendedAt: null }]);
    assert.deepEqual(await ensurePortal(db, input), { status: 'slug-mismatch', slug: 'smith-realty', existingSlugs: ['abc-realty'] });
    assert.equal(created.accounts.length + created.portals.length, 0);
  });

  it('treats a concurrent create as already existing', async () => {
    const { db } = fakeDb([], { raceOnCreate: true });
    assert.equal((await ensurePortal(db, input)).status, 'exists');
  });
});

describe('primaryDomain', () => {
  it('skips localhost names', () => {
    assert.equal(primaryDomain(['abc-realty.localhost', 'localhost']), null);
    assert.equal(primaryDomain(['localhost', 'carolinagolfhomes.com']), 'carolinagolfhomes.com');
  });
});

describe('describeEnsurePortal', () => {
  const context = { listingMode: 'hidden', idxApproved: false, apiUrl: 'https://api.example.com/' };

  it('prints a ready line with the readiness URL when the portal is created', () => {
    const { ok, lines } = describeEnsurePortal({ status: 'created', slug: 'smith-realty', name: 'Smith Realty', customDomain: 'smithrealty.com' }, context);
    assert.equal(ok, true);
    assert.equal(lines[0], '✓ Portal smith-realty ready (created): Smith Realty · smithrealty.com · listings: hidden (MLS listings stay hidden until IDX approval)');
    assert.equal(lines[1], '  check: https://api.example.com/api/portals/slug/smith-realty/readiness');
  });

  it('omits the readiness URL when API_URL is unknown', () => {
    const { lines } = describeEnsurePortal({ status: 'exists', slug: 'smith-realty', isActive: true, suspended: false }, { ...context, apiUrl: undefined, idxApproved: true });
    assert.deepEqual(lines, ['✓ Portal smith-realty ready (existing, not changed) · listings: hidden']);
  });

  it('warns with the fix for a slug mismatch and an inactive portal', () => {
    const mismatch = describeEnsurePortal({ status: 'slug-mismatch', slug: 'smith-realty', existingSlugs: ['abc-realty'] }, context);
    assert.equal(mismatch.ok, false);
    assert.match(mismatch.lines.join('\n'), /slug 'smith-realty' has no portal; this database has 'abc-realty'[\s\S]*docs\/COMPOSE\.md#going-live/);
    const inactive = describeEnsurePortal({ status: 'exists', slug: 'smith-realty', isActive: false, suspended: false }, context);
    assert.equal(inactive.ok, false);
    assert.match(inactive.lines[0], /inactive, so the site returns 404/);
  });
});
