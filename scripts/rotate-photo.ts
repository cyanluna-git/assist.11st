/**
 * Rotate a specific photo in R2 by 90 degrees clockwise.
 * Usage: npx ts-node --env-file=.env.local scripts/rotate-photo.ts <originalKey> [thumbnailKey]
 *
 * Example:
 *   npx ts-node --env-file=.env.local scripts/rotate-photo.ts \
 *     gallery/original/1773148595700-wwpe64p8laa.webp \
 *     gallery/thumbnail/1773148595700-wwpe64p8laa.webp
 */

import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import sharp from "sharp";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

const DEGREES = 90; // clockwise

async function getClient() {
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

async function downloadFromR2(client: S3Client, key: string): Promise<Buffer> {
  const res = await client.send(
    new GetObjectCommand({ Bucket: process.env.R2_BUCKET_NAME!, Key: key })
  );
  const chunks: Uint8Array[] = [];
  for await (const chunk of res.Body as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function uploadToR2(client: S3Client, key: string, buffer: Buffer) {
  await client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: buffer,
      ContentType: "image/webp",
    })
  );
  console.log(`✅ Uploaded: ${key}`);
}

async function rotateKey(client: S3Client, key: string, thumbWidth?: number) {
  console.log(`⬇️  Downloading: ${key}`);
  const input = await downloadFromR2(client, key);

  let pipeline = sharp(input).rotate(DEGREES).withMetadata();
  if (thumbWidth) {
    pipeline = pipeline.resize(thumbWidth, thumbWidth, {
      fit: "inside",
      withoutEnlargement: true,
    }) as typeof pipeline;
  }
  const output = await pipeline.webp({ quality: thumbWidth ? 70 : 85 }).toBuffer();

  await uploadToR2(client, key, output);
}

async function main() {
  const [, , originalKey, thumbnailKey] = process.argv;

  if (!originalKey) {
    console.error("Usage: ts-node scripts/rotate-photo.ts <originalKey> [thumbnailKey]");
    process.exit(1);
  }

  const client = await getClient();
  await rotateKey(client, originalKey);
  if (thumbnailKey) {
    await rotateKey(client, thumbnailKey, 400);
  }
  console.log("🎉 Done! Refresh the page to see the change.");
}

main().catch((e) => { console.error(e); process.exit(1); });
