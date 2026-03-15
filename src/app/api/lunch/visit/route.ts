import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { lunchVisitEvents, lunchVisitStates } from "@/db/schema";
import { validateLunchVisitInput } from "@/lib/lunch-validation";
import { getSeoulDateKey } from "@/lib/seoul-date";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest) {
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

  const validated = validateLunchVisitInput({
    placeId: (body as { placeId?: string }).placeId,
    status: (body as { status?: string }).status,
  });

  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const visitDate = getSeoulDateKey();

  const insertedVisit = await db.transaction(async (tx) => {
    const inserted = await tx
      .insert(lunchVisitEvents)
      .values({
        userId: session.sub,
        kakaoPlaceId: validated.placeId,
        visitDate,
      })
      .onConflictDoNothing()
      .returning({ id: lunchVisitEvents.id });

    if (inserted.length === 0) {
      return null;
    }

    await tx
      .insert(lunchVisitStates)
      .values({
        userId: session.sub,
        kakaoPlaceId: validated.placeId,
        status: validated.status,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [lunchVisitStates.userId, lunchVisitStates.kakaoPlaceId],
        set: {
          status: validated.status,
          updatedAt: new Date(),
        },
      });

    return inserted[0];
  });

  if (!insertedVisit) {
    const existing = await db
      .select({ createdAt: lunchVisitEvents.createdAt })
      .from(lunchVisitEvents)
      .where(
        and(
          eq(lunchVisitEvents.userId, session.sub),
          eq(lunchVisitEvents.kakaoPlaceId, validated.placeId),
          eq(lunchVisitEvents.visitDate, visitDate),
        ),
      )
      .limit(1);

    return NextResponse.json(
      {
        error: "가봤어요는 같은 식당에 하루 한 번만 기록할 수 있습니다.",
        errorCode: "visit_daily_limit",
        retryable: false,
        visitedAt: existing[0]?.createdAt?.toISOString() ?? null,
      },
      { status: 409 },
    );
  }

  return NextResponse.json({
    success: true,
    visitDate,
    incremental: true,
  });
}
