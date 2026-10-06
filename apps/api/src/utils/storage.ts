import type { S3ClientConfig } from '@aws-sdk/client-s3';

type Env = Record<string, string | undefined>;

/**
 * S3 client options from the STORAGE_* env, or null when storage is not configured.
 * Mirrors apps/mls-service/src/storage/s3.ts — keep the two in step.
 *
 * - S3-compatible (R2, MinIO): STORAGE_ENDPOINT + STORAGE_ACCESS_KEY + STORAGE_SECRET_KEY.
 * - AWS S3: omit the endpoint and keys and set AWS_REGION (or STORAGE_REGION); the
 *   SDK's default credential chain supplies credentials, e.g. an ECS task role.
 */
export function s3ClientConfig(env: Env = process.env): S3ClientConfig | null {
  const endpoint = env.STORAGE_ENDPOINT || undefined;
  const accessKeyId = env.STORAGE_ACCESS_KEY;
  const secretAccessKey = env.STORAGE_SECRET_KEY;
  const region = env.STORAGE_REGION || env.AWS_REGION;

  if (!env.STORAGE_BUCKET) return null;
  // Half-set static credentials are a misconfiguration, not a cue to fall back.
  if (Boolean(accessKeyId) !== Boolean(secretAccessKey)) return null;
  if (!endpoint && !region) return null;
  // A custom endpoint without static keys has no credential source we support.
  if (endpoint && !accessKeyId) return null;

  return {
    ...(endpoint ? { endpoint } : {}),
    region: region || 'auto',
    ...(accessKeyId ? { credentials: { accessKeyId, secretAccessKey: secretAccessKey as string } } : {}),
  };
}
