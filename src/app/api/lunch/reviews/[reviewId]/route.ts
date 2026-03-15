import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { lunchReviewPhotos, lunchReviews } from "@/db/schema";
import { canEditLunchReview } from "../permissions";
import { validateLunchReviewInput } from "@/lib/lunch-validation";
import { deleteMultipleFromR2, extractKeyFromUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

async function getOwnedReview(reviewId: string) {
  return db
    .select({
      id: lunchReviews.id,
      userId: lunchReviews.userId,
    })
    .from(lunchReviews)
    .where(eq(lunchReviews.id, reviewId))
    .then((rows) => rows[0] ?? null);
}

async function getReviewPhotoUrls(reviewId: string) {
  return db
    .select({
      imageUrl: lunchReviewPhotos.imageUrl,
    })
    .from(lunchReviewPhotos)
    .where(eq(lunchReviewPhotos.reviewId, reviewId));
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { reviewId } = await params;
  const review = await getOwnedReview(reviewId);
  if (!review) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!canEditLunchReview(review.userId, session.sub, session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const validated = validateLunchReviewInput({
    placeId: "ignored-for-update",
    content: (body as { content?: string }).content,
    photoUrls: (body as { photoUrls?: string[] }).photoUrls,
  });

  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const previousPhotos = await getReviewPhotoUrls(reviewId);

  await db.transaction(async (tx) => {
    await tx
      .update(lunchReviews)
      .set({
        rating: 0,
        content: validated.content,
        updatedAt: new Date(),
      })
      .where(eq(lunchReviews.id, reviewId));

    await tx.delete(lunchReviewPhotos).where(eq(lunchReviewPhotos.reviewId, reviewId));

    if (validated.photoUrls.length > 0) {
      await tx.insert(lunchReviewPhotos).values(
        validated.photoUrls.map((imageUrl, index) => ({
          reviewId,
          imageUrl,
          sortOrder: index,
        })),
      );
    }
  });

  const removedKeys = previousPhotos
    .map((photo) => photo.imageUrl)
    .filter((imageUrl) => !validated.photoUrls.includes(imageUrl))
    .map((imageUrl) => extractKeyFromUrl(imageUrl))
    .filter((key): key is string => Boolean(key));

  if (removedKeys.length > 0) {
    deleteMultipleFromR2(removedKeys).catch((error) => {
      console.error("Failed to delete removed lunch review photos:", error);
    });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { reviewId } = await params;
  const review = await getOwnedReview(reviewId);
  if (!review) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!canEditLunchReview(review.userId, session.sub, session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const photos = await getReviewPhotoUrls(reviewId);
  await db.delete(lunchReviews).where(eq(lunchReviews.id, reviewId));

  const photoKeys = photos
    .map((photo) => extractKeyFromUrl(photo.imageUrl))
    .filter((key): key is string => Boolean(key));
  if (photoKeys.length > 0) {
    deleteMultipleFromR2(photoKeys).catch((error) => {
      console.error("Failed to delete lunch review photos:", error);
    });
  }

  return NextResponse.json({ success: true });
}
