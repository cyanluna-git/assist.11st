import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { bookmarks } from "@/db/schema";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// ── GET /api/bookmarks/check?targetType=post&targetId=uuid ──────────────────

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const targetType = req.nextUrl.searchParams.get("targetType");
  const targetId = req.nextUrl.searchParams.get("targetId");

  if (!targetType || !targetId) {
    return NextResponse.json(
      { error: "targetType and targetId query params are required" },
      { status: 400 },
    );
  }

  const userId = session.sub;

  const existing = await db
    .select({ id: bookmarks.id })
    .from(bookmarks)
    .where(
      and(
        eq(bookmarks.userId, userId),
        eq(bookmarks.targetType, targetType),
        eq(bookmarks.targetId, targetId),
      ),
    )
    .then((rows) => rows[0] ?? null);

  return NextResponse.json({
    bookmarked: !!existing,
    bookmarkId: existing?.id ?? null,
  });
}
