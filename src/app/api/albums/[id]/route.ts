import { NextRequest, NextResponse } from "next/server";
import { eq, asc } from "drizzle-orm";

import { db } from "@/lib/db";
import { albums, photos, users } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { deleteMultipleFromR2, extractKeyFromUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const album = await db
    .select({
      id: albums.id,
      title: albums.title,
      description: albums.description,
      coverImageUrl: albums.coverImageUrl,
      createdBy: albums.createdBy,
      creatorName: users.name,
      createdAt: albums.createdAt,
    })
    .from(albums)
    .leftJoin(users, eq(albums.createdBy, users.id))
    .where(eq(albums.id, id))
    .then((rows) => rows[0] ?? null);

  if (!album) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const albumPhotos = await db
    .select({
      id: photos.id,
      imageUrl: photos.imageUrl,
      thumbnailUrl: photos.thumbnailUrl,
      caption: photos.caption,
      uploaderId: photos.uploaderId,
      uploaderName: users.name,
      createdAt: photos.createdAt,
    })
    .from(photos)
    .leftJoin(users, eq(photos.uploaderId, users.id))
    .where(eq(photos.albumId, id))
    .orderBy(asc(photos.createdAt));

  return NextResponse.json({ album, photos: albumPhotos });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const album = await db
    .select({ createdBy: albums.createdBy })
    .from(albums)
    .where(eq(albums.id, id))
    .then((rows) => rows[0] ?? null);

  if (!album) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (album.createdBy !== session.sub && session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const updates: Record<string, unknown> = {};

  if (body.title !== undefined) {
    if (typeof body.title !== "string" || body.title.length === 0 || body.title.length > 200) {
      return NextResponse.json({ error: "Invalid title" }, { status: 400 });
    }
    updates.title = body.title;
  }

  if (body.description !== undefined) {
    if (body.description !== null && (typeof body.description !== "string" || body.description.length > 2000)) {
      return NextResponse.json({ error: "Invalid description" }, { status: 400 });
    }
    updates.description = body.description;
  }

  if (body.coverImageUrl !== undefined) {
    if (body.coverImageUrl !== null && typeof body.coverImageUrl !== "string") {
      return NextResponse.json({ error: "Invalid coverImageUrl" }, { status: 400 });
    }
    updates.coverImageUrl = body.coverImageUrl;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const updated = await db
    .update(albums)
    .set(updates)
    .where(eq(albums.id, id))
    .returning();

  return NextResponse.json({ album: updated[0] });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const album = await db
    .select({ createdBy: albums.createdBy })
    .from(albums)
    .where(eq(albums.id, id))
    .then((rows) => rows[0] ?? null);

  if (!album) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (album.createdBy !== session.sub && session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Get all photos to delete from R2
  const albumPhotos = await db
    .select({
      imageUrl: photos.imageUrl,
      thumbnailUrl: photos.thumbnailUrl,
    })
    .from(photos)
    .where(eq(photos.albumId, id));

  // Collect all R2 keys to delete
  const keysToDelete: string[] = [];
  for (const photo of albumPhotos) {
    const originalKey = extractKeyFromUrl(photo.imageUrl);
    const thumbKey = extractKeyFromUrl(photo.thumbnailUrl);
    if (originalKey) keysToDelete.push(originalKey);
    if (thumbKey) keysToDelete.push(thumbKey);
  }

  // Delete album from DB (cascade deletes photos rows)
  await db.delete(albums).where(eq(albums.id, id));

  // Delete files from R2 (best-effort, don't fail the request)
  try {
    await deleteMultipleFromR2(keysToDelete);
  } catch (err) {
    console.error("Failed to delete R2 files for album:", id, err);
  }

  return NextResponse.json({ success: true });
}
