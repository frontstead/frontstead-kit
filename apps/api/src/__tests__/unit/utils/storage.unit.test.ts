import { describe, it, expect } from 'vitest';
import { s3ClientConfig } from '../../../utils/storage.js';

describe('s3ClientConfig', () => {
  it('uses the endpoint and static keys for S3-compatible storage', () => {
    expect(
      s3ClientConfig({
        STORAGE_BUCKET: 'b',
        STORAGE_ENDPOINT: 'https://r2.example.com',
        STORAGE_ACCESS_KEY: 'ak',
        STORAGE_SECRET_KEY: 'sk',
      }),
    ).toEqual({
      endpoint: 'https://r2.example.com',
      region: 'auto',
      credentials: { accessKeyId: 'ak', secretAccessKey: 'sk' },
    });
  });

  it('falls back to the default credential chain on AWS', () => {
    expect(s3ClientConfig({ STORAGE_BUCKET: 'b', AWS_REGION: 'us-east-1' })).toEqual({ region: 'us-east-1' });
    expect(s3ClientConfig({ STORAGE_BUCKET: 'b', AWS_REGION: 'us-east-1', STORAGE_REGION: 'us-west-2' })).toEqual({
      region: 'us-west-2',
    });
  });

  it('rejects incomplete configurations', () => {
    expect(s3ClientConfig({ AWS_REGION: 'us-east-1' })).toBeNull();
    expect(s3ClientConfig({ STORAGE_BUCKET: 'b' })).toBeNull();
    expect(s3ClientConfig({ STORAGE_BUCKET: 'b', AWS_REGION: 'us-east-1', STORAGE_ACCESS_KEY: 'ak' })).toBeNull();
    expect(s3ClientConfig({ STORAGE_BUCKET: 'b', STORAGE_ENDPOINT: 'https://r2.example.com' })).toBeNull();
  });
});
