import { randomBytes } from 'node:crypto';

const PASSWORD_ENV_VAR = 'DEMO_SEED_PASSWORD';
const MIN_LENGTH = 12;

export interface DemoSeedPassword {
  password: string;
  generated: boolean;
}

// Demo seeds never use a fixed password. This repository is public, so a fixed
// one would sign anyone in to every deployment that was ever seeded. Set
// DEMO_SEED_PASSWORD to choose the password for local work; otherwise each run
// generates one, and the seed prints it once.
export function resolveDemoSeedPassword(env: NodeJS.ProcessEnv = process.env): DemoSeedPassword {
  const chosen = env[PASSWORD_ENV_VAR];
  if (chosen) {
    if (chosen.length < MIN_LENGTH) {
      throw new Error(`${PASSWORD_ENV_VAR} must be at least ${MIN_LENGTH} characters.`);
    }
    return { password: chosen, generated: false };
  }
  return { password: randomBytes(18).toString('base64url'), generated: true };
}

// What a seed prints for the password: a generated one in full (it exists
// nowhere else), a chosen one by name only.
export function describeDemoSeedPassword({ password, generated }: DemoSeedPassword): string {
  return generated
    ? `${password}  (generated for this run; set ${PASSWORD_ENV_VAR} to choose one)`
    : `the value of ${PASSWORD_ENV_VAR}`;
}
