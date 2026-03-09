import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { albums, photos } from "@/db/schema";
import { getSession } from "@/lib/auth";
import {
  getR2Client,
  getBucketName,
  generateKey,
  uploadToR2,
  deleteFromR2,
  extractKeyFromUrl,
} from "@/lib/storage";
import { processImage } from "@/lib/image";

export const dynamic = "force-dynamic";

const MAX_FILES = 20;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: albumId } = await params;

  // Verify album exists
  const album = await db
    .select({
      id: albums.id,
      coverImageUrl: albums.coverImageUrl,
    })
    .from(albums)
    .where(eq(albums.id, albumId))
    .then((rows) => rows[0] ?? null);

  if (!album) {
    return NextResponse.json({ error: "Album not found" }, { status: 404 });
  }

  // Check R2 is configured
  const client = getR2Client();
  const bucket = getBucketName();
  if (!client || !bucket) {
    return NextResponse.json(
      { error: "Storage not configured" },
      { status: 503 },
    );
  }

  const formData = await req.formData();
  const files = formData.getAll("files") as File[];

  if (files.length === 0) {
    return NextResponse.json(
      { error: "No files provided" },
      { status: 400 },
    );
  }

  if (files.length > MAX_FILES) {
    return NextResponse.json(
      { error: `Too many files (max ${MAX_FILES})` },
      { status: 400 },
    );
  }

  // Validate all files first
  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File "${file.name}" too large (max 10MB)` },
        { status: 400 },
      );
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `File "${file.name}" has invalid type: ${file.type}` },
        { status: 400 },
      );
    }
  }

  const uploadedPhotos: Array<{
    id: string;
    imageUrl: string;
    thumbnailUrl: string;
    caption: string | null;
  }> = [];

  const errors: string[] = [];

  for (const file of files) {
    try {
      const inputBuffer = Buffer.from(await file.arrayBuffer());
      const processed = await processImage(inputBuffer);

      const originalKey = generateKey("gallery/original", "webp");
      const thumbnailKey = generateKey("gallery/thumbnail", "webp");

      const [originalUrl, thumbnailUrl] = await Promise.all([
        uploadToR2(originalKey, processed.originalBuffer, processed.contentType),
        uploadToR2(thumbnailKey, processed.thumbnailBuffer, processed.contentType),
      ]);

      const caption = formData.get(`caption_${file.name}`) as string | null;

      const inserted = await db
        .insert(photos)
        .values({
          albumId,
          uploaderId: session.sub,
          imageUrl: originalUrl,
          thumbnailUrl,
          caption: caption || null,
        })
        .returning();

      uploadedPhotos.push({
        id: inserted[0].id,
        imageUrl: inserted[0].imageUrl,
        thumbnailUrl: inserted[0].thumbnailUrl,
        caption: inserted[0].caption,
      });
    } catch (err) {
      console.error(`Failed to upload ${file.name}:`, err);
      errors.push(file.name);
    }
  }

  // Auto-set cover image if album doesn't have one and we uploaded at least one photo
  if (!album.coverImageUrl && uploadedPhotos.length > 0) {
    await db
      .update(albums)
      .set({ coverImageUrl: uploadedPhotos[0].thumbnailUrl })
      .where(eq(albums.id, albumId));
  }

  return NextResponse.json(
    {
      photos: uploadedPhotos,
      ...(errors.length > 0 ? { errors } : {}),
    },
    { status: 201 },
  );
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: albumId } = await params;

  const body = await req.json();
  const { photoId } = body;

  if (!photoId || typeof photoId !== "string") {
    return NextResponse.json(
      { error: "photoId is required" },
      { status: 400 },
    );
  }

  // Get the photo
  const photo = await db
    .select({
      id: photos.id,
      albumId: photos.albumId,
      uploaderId: photos.uploaderId,
      imageUrl: photos.imageUrl,
      thumbnailUrl: photos.thumbnailUrl,
    })
    .from(photos)
    .where(eq(photos.id, photoId))
    .then((rows) => rows[0] ?? null);

  if (!photo) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  if (photo.albumId !== albumId) {
    return NextResponse.json(
      { error: "Photo does not belong to this album" },
      { status: 400 },
    );
  }

  // Only the uploader or admin can delete
  if (photo.uploaderId !== session.sub && session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Delete from DB
  await db.delete(photos).where(eq(photos.id, photoId));

  // Delete from R2 (best-effort)
  try {
    const originalKey = extractKeyFromUrl(photo.imageUrl);
    const thumbKey = extractKeyFromUrl(photo.thumbnailUrl);

    await Promise.all([
      originalKey ? deleteFromR2(originalKey) : Promise.resolve(),
      thumbKey ? deleteFromR2(thumbKey) : Promise.resolve(),
    ]);
  } catch (err) {
    console.error("Failed to delete R2 files for photo:", photoId, err);
  }

  // If this photo was the album cover, update cover to another photo or null
  const album = await db
    .select({ coverImageUrl: albums.coverImageUrl })
    .from(albums)
    .where(eq(albums.id, albumId))
    .then((rows) => rows[0] ?? null);

  if (
    album &&
    (album.coverImageUrl === photo.thumbnailUrl ||
      album.coverImageUrl === photo.imageUrl)
  ) {
    const nextPhoto = await db
      .select({ thumbnailUrl: photos.thumbnailUrl })
      .from(photos)
      .where(eq(photos.albumId, albumId))
      .limit(1)
      .then((rows) => rows[0] ?? null);

    await db
      .update(albums)
      .set({ coverImageUrl: nextPhoto?.thumbnailUrl ?? null })
      .where(eq(albums.id, albumId));
  }

  return NextResponse.json({ success: true });
}
