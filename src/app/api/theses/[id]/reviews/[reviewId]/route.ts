import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { thesisReviews } from "@/db/schema";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; reviewId: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { reviewId } = await params;

  const existing = await db
    .select({ reviewerId: thesisReviews.reviewerId })
    .from(thesisReviews)
    .where(eq(thesisReviews.id, reviewId))
    .then((rows) => rows[0] ?? null);

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (existing.reviewerId !== session.sub && session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const updates: Record<string, unknown> = {};

  if (body.rating !== undefined) {
    if (body.rating !== null && (typeof body.rating !== "number" || body.rating < 1 || body.rating > 5)) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 },
      );
    }
    updates.rating = body.rating;
  }
  if (body.feedback !== undefined) updates.feedback = body.feedback;
  if (body.isAnonymous !== undefined) updates.isAnonymous = body.isAnonymous === true;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  }

  await db
    .update(thesisReviews)
    .set(updates)
    .where(eq(thesisReviews.id, reviewId));

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; reviewId: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { reviewId } = await params;

  const existing = await db
    .select({ reviewerId: thesisReviews.reviewerId })
    .from(thesisReviews)
    .where(eq(thesisReviews.id, reviewId))
    .then((rows) => rows[0] ?? null);

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (existing.reviewerId !== session.sub && session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.delete(thesisReviews).where(eq(thesisReviews.id, reviewId));

  return NextResponse.json({ success: true });
}
