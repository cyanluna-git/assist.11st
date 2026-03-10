import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { events, users, eventRsvps, groups } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { isGroupMember } from "@/lib/groups";

export const dynamic = "force-dynamic";

const VALID_CATEGORIES = ["class", "meetup", "mt", "dinner", "study"] as const;

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
      id: events.id,
      title: events.title,
      description: events.description,
      location: events.location,
      startAt: events.startAt,
      endAt: events.endAt,
      category: events.category,
      isRecurring: events.isRecurring,
      recurrenceRule: events.recurrenceRule,
      creatorId: events.creatorId,
      groupId: events.groupId,
      createdAt: events.createdAt,
      updatedAt: events.updatedAt,
      creatorName: users.name,
      creatorAvatar: users.avatarUrl,
      rsvpAttending: sql<number>`(SELECT COUNT(*) FROM event_rsvps WHERE event_rsvps.event_id = ${events.id} AND event_rsvps.status = 'attending')`,
      rsvpDeclined: sql<number>`(SELECT COUNT(*) FROM event_rsvps WHERE event_rsvps.event_id = ${events.id} AND event_rsvps.status = 'declined')`,
      rsvpMaybe: sql<number>`(SELECT COUNT(*) FROM event_rsvps WHERE event_rsvps.event_id = ${events.id} AND event_rsvps.status = 'maybe')`,
      myRsvp: sql<string | null>`(SELECT event_rsvps.status FROM event_rsvps WHERE event_rsvps.event_id = ${events.id} AND event_rsvps.user_id = ${session.sub} LIMIT 1)`,
    })
    .from(events)
    .leftJoin(users, eq(events.creatorId, users.id))
    .where(eq(events.id, id))
    .then((rows) => rows[0] ?? null);

  if (!result) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Fetch RSVP user list
  const rsvps = await db
    .select({
      userId: eventRsvps.userId,
      status: eventRsvps.status,
      userName: users.name,
      userAvatar: users.avatarUrl,
    })
    .from(eventRsvps)
    .leftJoin(users, eq(eventRsvps.userId, users.id))
    .where(eq(eventRsvps.eventId, id));

  return NextResponse.json({
    event: {
      ...result,
      startAt: new Date(result.startAt).toISOString(),
      endAt: result.endAt ? new Date(result.endAt).toISOString() : null,
      createdAt: new Date(result.createdAt).toISOString(),
      updatedAt: new Date(result.updatedAt).toISOString(),
    },
    rsvps,
  });
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
    .select({ creatorId: events.creatorId })
    .from(events)
    .where(eq(events.id, id))
    .then((rows) => rows[0] ?? null);

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (existing.creatorId !== session.sub && session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const updates: Partial<typeof events.$inferInsert> = { updatedAt: new Date() };

  if (body.title !== undefined) {
    if (typeof body.title !== "string" || body.title.length > 200 || body.title.length === 0) {
      return NextResponse.json({ error: "Invalid title" }, { status: 400 });
    }
    updates.title = body.title;
  }

  if (body.description !== undefined) {
    if (body.description !== null && (typeof body.description !== "string" || body.description.length > 5000)) {
      return NextResponse.json({ error: "Invalid description" }, { status: 400 });
    }
    updates.description = body.description;
  }

  if (body.location !== undefined) {
    if (body.location !== null && (typeof body.location !== "string" || body.location.length > 500)) {
      return NextResponse.json({ error: "Invalid location" }, { status: 400 });
    }
    updates.location = body.location;
  }

  if (body.startAt !== undefined) {
    const d = new Date(body.startAt);
    if (isNaN(d.getTime())) {
      return NextResponse.json({ error: "Invalid startAt" }, { status: 400 });
    }
    updates.startAt = d;
  }

  if (body.endAt !== undefined) {
    if (body.endAt === null) {
      updates.endAt = null;
    } else {
      const d = new Date(body.endAt);
      if (isNaN(d.getTime())) {
        return NextResponse.json({ error: "Invalid endAt" }, { status: 400 });
      }
      updates.endAt = d;
    }
  }

  if (body.category !== undefined) {
    if (body.category !== null && !VALID_CATEGORIES.includes(body.category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}` },
        { status: 400 },
      );
    }
    updates.category = body.category;
  }

  if (body.isRecurring !== undefined) {
    updates.isRecurring = Boolean(body.isRecurring);
  }

  if (body.recurrenceRule !== undefined) {
    updates.recurrenceRule = body.recurrenceRule || null;
  }

  if (body.group_id !== undefined) {
    if (body.group_id === null) {
      updates.groupId = null;
    } else {
      if (typeof body.group_id !== "string") {
        return NextResponse.json({ error: "group_id must be a string" }, { status: 400 });
      }
      // Check group exists
      const groupExists = await db
        .select({ id: groups.id })
        .from(groups)
        .where(eq(groups.id, body.group_id))
        .then((rows) => rows[0] ?? null);

      if (!groupExists) {
        return NextResponse.json({ error: "Group not found" }, { status: 404 });
      }

      // Caller must be a member of the group (unless admin)
      const member = await isGroupMember(body.group_id, session.sub);
      if (!member && session.role !== "admin") {
        return NextResponse.json(
          { error: "You must be a member of the group to associate this event" },
          { status: 403 },
        );
      }
      updates.groupId = body.group_id;
    }
  }

  await db
    .update(events)
    .set(updates)
    .where(eq(events.id, id));

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
    .select({ creatorId: events.creatorId })
    .from(events)
    .where(eq(events.id, id))
    .then((rows) => rows[0] ?? null);

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (existing.creatorId !== session.sub && session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // RSVPs cascade via ON DELETE CASCADE, but do explicit cleanup for safety
  // Neon HTTP doesn't support transactions, so sequential deletes
  await db.delete(eventRsvps).where(eq(eventRsvps.eventId, id));
  await db.delete(events).where(eq(events.id, id));

  return NextResponse.json({ success: true });
}
