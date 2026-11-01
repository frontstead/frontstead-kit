import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { ensurePortal, type EnsurePortalDb } from 'db/ensurePortal';
import { createTestApp, closeTestApp } from '../utils/testApp.js';
import { clearDatabase } from '../utils/testHelpers.js';

// ensurePortal runs in `db:migrate` against real databases, so exercise it
// against PostgreSQL with the real Prisma client rather than a fake.
const input = {
  slug: 'smith-realty',
  name: 'Smith Realty',
  brokerageName: 'Smith Realty LLC',
  brokeragePhone: '(704) 555-0199',
  domains: ['smith-realty.localhost', 'smithrealty.com', 'localhost'],
};

describe('ensurePortal - integration', () => {
  let prisma;
  let db: EnsurePortalDb;

  beforeAll(async () => {
    ({ prisma } = await createTestApp());
    db = prisma as unknown as EnsurePortalDb;
  });

  afterAll(async () => {
    await closeTestApp();
  });

  beforeEach(async () => {
    // Deleting accounts cascades to their portals.
    await clearDatabase(prisma);
  });

  it('creates exactly one Account and one active Portal, and no users', async () => {
    const result = await ensurePortal(db, input);
    expect(result).toEqual({ status: 'created', slug: 'smith-realty', name: 'Smith Realty', customDomain: 'smithrealty.com' });

    const portals = await prisma.portal.findMany();
    expect(portals).toHaveLength(1);
    expect(portals[0]).toMatchObject({
      slug: 'smith-realty',
      name: 'Smith Realty',
      brokerageName: 'Smith Realty LLC',
      brokeragePhone: '(704) 555-0199',
      customDomain: 'smithrealty.com',
      isActive: true,
    });
    expect(await prisma.account.count()).toBe(1);
    expect(await prisma.user.count()).toBe(0);
  });

  it('changes nothing on a re-run, including dashboard edits', async () => {
    await ensurePortal(db, input);
    await prisma.portal.update({ where: { slug: 'smith-realty' }, data: { brokeragePhone: '(704) 555-0123', name: 'Smith Realty Group' } });

    const result = await ensurePortal(db, input);
    expect(result).toEqual({ status: 'exists', slug: 'smith-realty', isActive: true, suspended: false });
    expect(await prisma.portal.count()).toBe(1);
    expect(await prisma.account.count()).toBe(1);
    expect(await prisma.portal.findUniqueOrThrow({ where: { slug: 'smith-realty' } })).toMatchObject({
      brokeragePhone: '(704) 555-0123',
      name: 'Smith Realty Group',
    });
  });

  it('creates nothing when the database already holds a portal with another slug', async () => {
    const account = await prisma.account.create({ data: { name: 'ABC Realty' } });
    await prisma.portal.create({ data: { slug: 'abc-realty', name: 'ABC Realty', accountId: account.id, isActive: true } });

    const result = await ensurePortal(db, input);
    expect(result).toEqual({ status: 'slug-mismatch', slug: 'smith-realty', existingSlugs: ['abc-realty'] });
    expect(await prisma.portal.count()).toBe(1);
    expect(await prisma.account.count()).toBe(1);
  });
});
