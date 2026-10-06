import { S3Client, PutObjectCommand, DeleteObjectCommand, type S3ClientConfig } from '@aws-sdk/client-s3';

/**
 * Server-side object storage for downloaded MLS media (same STORAGE_* config as
 * apps/api). mls-service downloads photos from MLS Grid and PutObjects them here
 * (no presigned URLs — it has the bytes). Public URLs are served from
 * STORAGE_PUBLIC_BASE_URL.
 *
 * Two modes:
 * - S3-compatible (R2, MinIO): STORAGE_ENDPOINT + STORAGE_ACCESS_KEY + STORAGE_SECRET_KEY.
 * - AWS S3: omit the endpoint and keys and set AWS_REGION (or STORAGE_REGION); the
 *   SDK's default credential chain supplies credentials, e.g. an ECS task role.
 */

type Env = Record<string, string | undefined>;

/** S3 client options from env, or null when storage is not configured. */
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

let _client: S3Client | null = null;

function client(): S3Client {
  if (!_client) {
    const config = s3ClientConfig();
    if (!config) {
      throw new Error(
        'Storage not configured (STORAGE_BUCKET plus STORAGE_ENDPOINT/STORAGE_ACCESS_KEY/STORAGE_SECRET_KEY, or AWS_REGION)',
      );
    }
    _client = new S3Client(config);
  }
  return _client;
}

export function isStorageConfigured(): boolean {
  return s3ClientConfig() !== null;
}

/** The public, servable URL for a stored key. */
export function publicUrl(key: string): string {
  const base = (process.env.STORAGE_PUBLIC_BASE_URL ?? '').replace(/\/+$/, '');
  return `${base}/${key}`;
}

export async function putObject(key: string, body: Uint8Array, contentType: string): Promise<string> {
  const Bucket = process.env.STORAGE_BUCKET as string;
  await client().send(new PutObjectCommand({ Bucket, Key: key, Body: body, ContentType: contentType }));
  return publicUrl(key);
}

export async function deleteObject(key: string): Promise<void> {
  const Bucket = process.env.STORAGE_BUCKET as string;
  await client().send(new DeleteObjectCommand({ Bucket, Key: key }));
}
