import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";

let _client: S3Client | null = null;

export function getR2Client(): S3Client | null {
  if (_client) return _client;

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) return null;

  _client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });

  return _client;
}

export function getBucketName(): string | undefined {
  return process.env.R2_BUCKET_NAME;
}

export function getPublicUrl(): string | undefined {
  return process.env.R2_PUBLIC_URL;
}

/**
 * Generate a unique R2 key for a file upload.
 */
export function generateKey(prefix: string, ext: string): string {
  return `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
}

/**
 * Build the full public URL for a given R2 key.
 */
export function buildUrl(key: string): string {
  const publicUrl = getPublicUrl();
  return publicUrl ? `${publicUrl}/${key}` : key;
}

/**
 * Upload a buffer to R2 and return the public URL.
 */
export async function uploadToR2(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<string> {
  const client = getR2Client();
  const bucket = getBucketName();

  if (!client || !bucket) {
    throw new Error("R2 is not configured");
  }

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );

  return buildUrl(key);
}

/**
 * Delete a single object from R2 by key.
 */
export async function deleteFromR2(key: string): Promise<void> {
  const client = getR2Client();
  const bucket = getBucketName();

  if (!client || !bucket) return;

  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );
}

/**
 * Delete multiple objects from R2 by keys.
 */
export async function deleteMultipleFromR2(keys: string[]): Promise<void> {
  if (keys.length === 0) return;

  const client = getR2Client();
  const bucket = getBucketName();

  if (!client || !bucket) return;

  // DeleteObjects supports max 1000 keys at once
  const batches: string[][] = [];
  for (let i = 0; i < keys.length; i += 1000) {
    batches.push(keys.slice(i, i + 1000));
  }

  for (const batch of batches) {
    await client.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: {
          Objects: batch.map((k) => ({ Key: k })),
        },
      }),
    );
  }
}

/**
 * Extract the R2 key from a full public URL.
 * e.g., "https://pub.example.com/gallery/original/123.webp" -> "gallery/original/123.webp"
 */
export function extractKeyFromUrl(url: string): string | null {
  const publicUrl = getPublicUrl();
  if (publicUrl && url.startsWith(publicUrl)) {
    return url.slice(publicUrl.length + 1); // +1 for the "/"
  }
  // If URL doesn't start with public URL, it might already be a key
  if (!url.startsWith("http")) {
    return url;
  }
  return null;
}
