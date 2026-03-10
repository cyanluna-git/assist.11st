import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { userNewsSubscriptions, newsSources } from "@/db/schema";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/news/subscriptions — list subscribed source IDs
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select({ sourceId: userNewsSubscriptions.sourceId })
    .from(userNewsSubscriptions)
    .where(eq(userNewsSubscriptions.userId, session.sub));

  return NextResponse.json({ sourceIds: rows.map((r) => r.sourceId) });
}

// POST /api/news/subscriptions — subscribe to a source
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { sourceId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { sourceId } = body;
  if (!sourceId || typeof sourceId !== "string") {
    return NextResponse.json({ error: "sourceId is required" }, { status: 400 });
  }

  // Verify source exists
  const source = await db
    .select({ id: newsSources.id })
    .from(newsSources)
    .where(and(eq(newsSources.id, sourceId), eq(newsSources.isActive, true)))
    .limit(1);

  if (source.length === 0) {
    return NextResponse.json({ error: "Source not found" }, { status: 404 });
  }

  // Idempotent insert
  const existing = await db
    .select({ id: userNewsSubscriptions.id })
    .from(userNewsSubscriptions)
    .where(
      and(
        eq(userNewsSubscriptions.userId, session.sub),
        eq(userNewsSubscriptions.sourceId, sourceId),
      ),
    )
    .limit(1);

  if (existing.length === 0) {
    await db.insert(userNewsSubscriptions).values({
      userId: session.sub,
      sourceId,
    });
  }

  return NextResponse.json({ subscribed: true });
}

// DELETE /api/news/subscriptions?sourceId=X — unsubscribe
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sourceId = req.nextUrl.searchParams.get("sourceId");
  if (!sourceId) {
    return NextResponse.json({ error: "sourceId is required" }, { status: 400 });
  }

  await db
    .delete(userNewsSubscriptions)
    .where(
      and(
        eq(userNewsSubscriptions.userId, session.sub),
        eq(userNewsSubscriptions.sourceId, sourceId),
      ),
    );

  return NextResponse.json({ subscribed: false });
}
