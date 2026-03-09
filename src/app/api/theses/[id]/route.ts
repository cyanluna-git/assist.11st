import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { thesis, users, thesisReviews } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { deleteFromR2, extractKeyFromUrl } from "@/lib/storage";

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

  const result = await db
    .select({
      id: thesis.id,
      title: thesis.title,
      abstract: thesis.abstract,
      field: thesis.field,
      status: thesis.status,
      fileUrl: thesis.fileUrl,
      createdAt: thesis.createdAt,
      updatedAt: thesis.updatedAt,
      authorId: thesis.authorId,
      authorName: users.name,
      authorAvatar: users.avatarUrl,
      avgRating: sql<number>`coalesce(avg(${thesisReviews.rating}), 0)`,
      reviewCount: sql<number>`count(${thesisReviews.id})`,
    })
    .from(thesis)
    .leftJoin(users, eq(thesis.authorId, users.id))
    .leftJoin(thesisReviews, eq(thesis.id, thesisReviews.thesisId))
    .where(eq(thesis.id, id))
    .groupBy(thesis.id, users.name, users.avatarUrl)
    .then((rows) => rows[0] ?? null);

  if (!result) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ thesis: result });
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

  const existing = await db
    .select({ authorId: thesis.authorId })
    .from(thesis)
    .where(eq(thesis.id, id))
    .then((rows) => rows[0] ?? null);

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (existing.authorId !== session.sub && session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if (body.title !== undefined) {
    if (typeof body.title !== "string" || body.title.length > 300) {
      return NextResponse.json({ error: "Invalid title" }, { status: 400 });
    }
    updates.title = body.title;
  }
  if (body.abstract !== undefined) updates.abstract = body.abstract;
  if (body.field !== undefined) updates.field = body.field;
  if (body.status !== undefined) {
    if (!["draft", "submitted", "reviewed"].includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    updates.status = body.status;
  }

  await db.update(thesis).set(updates).where(eq(thesis.id, id));

  return NextResponse.json({ success: true });
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

  const existing = await db
    .select({ authorId: thesis.authorId, fileUrl: thesis.fileUrl })
    .from(thesis)
    .where(eq(thesis.id, id))
    .then((rows) => rows[0] ?? null);

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (existing.authorId !== session.sub && session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Clean up R2 file if exists
  if (existing.fileUrl) {
    const key = extractKeyFromUrl(existing.fileUrl);
    if (key) {
      try {
        await deleteFromR2(key);
      } catch {
        // R2 cleanup failure must not block deletion
      }
    }
  }

  // Cascade deletes reviews automatically via FK constraint
  await db.delete(thesis).where(eq(thesis.id, id));

  return NextResponse.json({ success: true });
}
