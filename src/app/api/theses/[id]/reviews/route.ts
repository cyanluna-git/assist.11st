import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";

import { db } from "@/lib/db";
import { thesis, thesisReviews, users } from "@/db/schema";
import { getSession } from "@/lib/auth";

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

  // Verify thesis exists
  const existing = await db
    .select({ id: thesis.id })
    .from(thesis)
    .where(eq(thesis.id, id))
    .then((rows) => rows[0] ?? null);

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const reviews = await db
    .select({
      id: thesisReviews.id,
      thesisId: thesisReviews.thesisId,
      reviewerId: thesisReviews.reviewerId,
      rating: thesisReviews.rating,
      feedback: thesisReviews.feedback,
      isAnonymous: thesisReviews.isAnonymous,
      createdAt: thesisReviews.createdAt,
      reviewerName: users.name,
      reviewerAvatar: users.avatarUrl,
    })
    .from(thesisReviews)
    .leftJoin(users, eq(thesisReviews.reviewerId, users.id))
    .where(eq(thesisReviews.thesisId, id));

  // Mask anonymous reviewers (unless it's the reviewer themselves)
  const masked = reviews.map((r) => {
    if (r.isAnonymous && r.reviewerId !== session.sub) {
      return {
        ...r,
        reviewerId: null,
        reviewerName: "익명",
        reviewerAvatar: null,
      };
    }
    return r;
  });

  return NextResponse.json({ reviews: masked });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify thesis exists and check self-review
  const existing = await db
    .select({ id: thesis.id, authorId: thesis.authorId })
    .from(thesis)
    .where(eq(thesis.id, id))
    .then((rows) => rows[0] ?? null);

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (existing.authorId === session.sub) {
    return NextResponse.json(
      { error: "자신의 논문에는 리뷰를 작성할 수 없습니다." },
      { status: 403 },
    );
  }

  // Check for duplicate review
  const duplicate = await db
    .select({ id: thesisReviews.id })
    .from(thesisReviews)
    .where(
      and(
        eq(thesisReviews.thesisId, id),
        eq(thesisReviews.reviewerId, session.sub),
      ),
    )
    .then((rows) => rows[0] ?? null);

  if (duplicate) {
    return NextResponse.json(
      { error: "이미 리뷰를 작성했습니다." },
      { status: 409 },
    );
  }

  const body = await req.json();
  const { rating, feedback, isAnonymous } = body;

  if (rating !== undefined && rating !== null) {
    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 },
      );
    }
  }

  if (feedback !== undefined && typeof feedback !== "string") {
    return NextResponse.json(
      { error: "Invalid feedback" },
      { status: 400 },
    );
  }

  const newReview = await db
    .insert(thesisReviews)
    .values({
      thesisId: id,
      reviewerId: session.sub,
      rating: rating ?? null,
      feedback: feedback || null,
      isAnonymous: isAnonymous === true,
    })
    .returning();

  return NextResponse.json({ review: newReview[0] }, { status: 201 });
}
