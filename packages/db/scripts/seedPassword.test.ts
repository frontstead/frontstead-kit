import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { describeDemoSeedPassword, resolveDemoSeedPassword } from './seedPassword.js';

describe('demo seed password', () => {
  it('generates a different strong password on every run by default', () => {
    const first = resolveDemoSeedPassword({});
    const second = resolveDemoSeedPassword({});
    assert.equal(first.generated, true);
    assert.ok(first.password.length >= 20);
    assert.notEqual(first.password, second.password);
    assert.ok(describeDemoSeedPassword(first).includes(first.password));
  });

  it('uses DEMO_SEED_PASSWORD when set, without printing it', () => {
    const chosen = resolveDemoSeedPassword({ DEMO_SEED_PASSWORD: 'correct-horse-battery' });
    assert.deepEqual(chosen, { password: 'correct-horse-battery', generated: false });
    assert.ok(!describeDemoSeedPassword(chosen).includes('correct-horse-battery'));
  });

  it('rejects a short DEMO_SEED_PASSWORD', () => {
    assert.throws(() => resolveDemoSeedPassword({ DEMO_SEED_PASSWORD: 'admin123' }), /at least 12 characters/);
  });
});
