import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { lunchReviewPhotos, lunchReviews } from "@/db/schema";
import { getLunchReviewsForPlace } from "@/lib/lunch";
import { validateLunchReviewInput } from "@/lib/lunch-validation";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const placeId = req.nextUrl.searchParams.get("placeId")?.trim();
  if (!placeId) {
    return NextResponse.json({ error: "placeId is required" }, { status: 400 });
  }

  const reviews = await getLunchReviewsForPlace(session.sub, placeId);
  return NextResponse.json({ reviews });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const validated = validateLunchReviewInput({
    placeId: (body as { placeId?: string }).placeId,
    content: (body as { content?: string }).content,
    photoUrls: (body as { photoUrls?: string[] }).photoUrls,
  });

  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const existing = await db
    .select({ id: lunchReviews.id })
    .from(lunchReviews)
    .where(
      and(
        eq(lunchReviews.userId, session.sub),
        eq(lunchReviews.kakaoPlaceId, validated.placeId),
      ),
    )
    .then((rows) => rows[0] ?? null);

  if (existing) {
    return NextResponse.json(
      { error: "이미 이 식당에 후기를 남겼습니다." },
      { status: 409 },
    );
  }

  const inserted = await db.transaction(async (tx) => {
    const created = await tx
      .insert(lunchReviews)
      .values({
        userId: session.sub,
        kakaoPlaceId: validated.placeId,
        rating: 0,
        content: validated.content,
        updatedAt: new Date(),
      })
      .returning({ id: lunchReviews.id });

    const reviewId = created[0]?.id;
    if (reviewId && validated.photoUrls.length > 0) {
      await tx.insert(lunchReviewPhotos).values(
        validated.photoUrls.map((imageUrl, index) => ({
          reviewId,
          imageUrl,
          sortOrder: index,
        })),
      );
    }

    return created;
  });

  return NextResponse.json({ id: inserted[0]?.id ?? null }, { status: 201 });
}
