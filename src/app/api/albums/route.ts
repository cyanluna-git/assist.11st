import { NextRequest, NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { albums, users } from "@/db/schema";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit")) || 20, 50);
  const offset = Number(req.nextUrl.searchParams.get("offset")) || 0;

  const result = await db
    .select({
      id: albums.id,
      title: albums.title,
      description: albums.description,
      coverImageUrl: albums.coverImageUrl,
      createdBy: albums.createdBy,
      creatorName: users.name,
      createdAt: albums.createdAt,
      photoCount: sql<number>`(SELECT COUNT(*) FROM photos WHERE photos.album_id = ${albums.id})`,
    })
    .from(albums)
    .leftJoin(users, eq(albums.createdBy, users.id))
    .orderBy(desc(albums.createdAt))
    .limit(limit)
    .offset(offset);

  return NextResponse.json({ albums: result });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { title, description } = body;

  if (!title || typeof title !== "string") {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  if (title.length > 200) {
    return NextResponse.json(
      { error: "Title too long (max 200)" },
      { status: 400 },
    );
  }

  if (description && (typeof description !== "string" || description.length > 2000)) {
    return NextResponse.json(
      { error: "Invalid description (max 2000)" },
      { status: 400 },
    );
  }

  const newAlbum = await db
    .insert(albums)
    .values({
      title,
      description: description || null,
      createdBy: session.sub,
    })
    .returning();

  return NextResponse.json({ album: newAlbum[0] }, { status: 201 });
}
