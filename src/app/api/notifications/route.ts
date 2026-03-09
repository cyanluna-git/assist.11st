import { NextRequest, NextResponse } from "next/server";
import { eq, desc, and, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { notifications } from "@/db/schema";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const unreadOnly = sp.get("unread") === "true";
  const rawLimit = sp.get("limit");
  const limit = rawLimit !== null ? Math.min(Math.max(Number(rawLimit), 0), 100) : 30;
  const offset = Number(sp.get("offset")) || 0;

  const conditions = [eq(notifications.userId, session.sub)];
  if (unreadOnly) {
    conditions.push(eq(notifications.isRead, false));
  }

  const rows = await db
    .select()
    .from(notifications)
    .where(and(...conditions))
    .orderBy(desc(notifications.createdAt))
    .limit(limit)
    .offset(offset);

  // Also get unread count
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, session.sub),
        eq(notifications.isRead, false),
      ),
    );

  return NextResponse.json({ notifications: rows, unreadCount: Number(count) });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (body.markAllRead) {
    // Mark all as read
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.userId, session.sub),
          eq(notifications.isRead, false),
        ),
      );
    return NextResponse.json({ success: true });
  }

  if (body.id) {
    // Mark single as read
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.id, body.id),
          eq(notifications.userId, session.sub),
        ),
      );
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Provide id or markAllRead" }, { status: 400 });
}
