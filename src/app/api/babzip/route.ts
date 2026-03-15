import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  fetchNearbyLunchPlaces,
  getLunchPlaceExclusions,
  serializeLunchError,
} from "@/lib/lunch";
import { getSession } from "@/lib/auth";
import { lunchPlaceExclusions } from "@/db/schema";

export const dynamic = "force-dynamic";

function serializeExclusionDates(
  rows: Awaited<ReturnType<typeof getLunchPlaceExclusions>>,
) {
  return rows.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));
}

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return null;
  }
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const [candidates, exclusions] = await Promise.all([
      fetchNearbyLunchPlaces(),
      getLunchPlaceExclusions(),
    ]);

    return NextResponse.json({
      candidates: candidates.places,
      exclusions: serializeExclusionDates(exclusions),
    });
  } catch (error) {
    const serialized = serializeLunchError(error);
    return NextResponse.json(
      {
        error: serialized.error,
        errorCode: serialized.errorCode,
        retryable: serialized.retryable,
      },
      { status: serialized.status },
    );
  }
}

export async function PUT(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const placeId = (body as { placeId?: string }).placeId?.trim();
  const placeName = (body as { placeName?: string }).placeName?.trim();
  const categoryName = (body as { categoryName?: string | null }).categoryName?.trim() || null;
  const roadAddressName =
    (body as { roadAddressName?: string | null }).roadAddressName?.trim() || null;
  const addressName = (body as { addressName?: string | null }).addressName?.trim() || null;
  const excluded = (body as { excluded?: unknown }).excluded;

  if (!placeId || !placeName || typeof excluded !== "boolean") {
    return NextResponse.json(
      { error: "placeId, placeName, excluded are required" },
      { status: 400 },
    );
  }

  if (excluded) {
    await db
      .insert(lunchPlaceExclusions)
      .values({
        kakaoPlaceId: placeId,
        placeName,
        categoryName,
        roadAddressName,
        addressName,
        addedBy: session.sub,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: lunchPlaceExclusions.kakaoPlaceId,
        set: {
          placeName,
          categoryName,
          roadAddressName,
          addressName,
          addedBy: session.sub,
          updatedAt: new Date(),
        },
      });
  } else {
    await db
      .delete(lunchPlaceExclusions)
      .where(eq(lunchPlaceExclusions.kakaoPlaceId, placeId));
  }

  return NextResponse.json({ success: true });
}
