import { NextRequest, NextResponse } from "next/server";
import { eq, and, gte, lte, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { events, users, groups } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { expandRecurrence } from "@/lib/recurrence";
import { isGroupMember } from "@/lib/groups";

export const dynamic = "force-dynamic";

const VALID_CATEGORIES = ["class", "meetup", "mt", "dinner", "study"] as const;
type EventCategory = (typeof VALID_CATEGORIES)[number];

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;

  // Default date range: current month start to +3 months
  const now = new Date();
  const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1);
  const defaultTo = new Date(now.getFullYear(), now.getMonth() + 3, 0);

  const from = sp.get("from") ? new Date(sp.get("from")!) : defaultFrom;
  const to = sp.get("to") ? new Date(sp.get("to")!) : defaultTo;
  const category = sp.get("category") as EventCategory | null;
  const groupId = sp.get("group_id");
  const limit = Math.min(Number(sp.get("limit")) || 50, 100);
  const offset = Number(sp.get("offset")) || 0;

  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
    return NextResponse.json({ error: "Invalid date range" }, { status: 400 });
  }

  try {

  // Build conditions
  const conditions = [
    gte(events.startAt, from),
    lte(events.startAt, to),
  ];

  if (category && VALID_CATEGORIES.includes(category)) {
    conditions.push(eq(events.category, category));
  }

  if (groupId) {
    conditions.push(eq(events.groupId, groupId));
  }

  const rows = await db
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
    .where(and(...conditions))
    .orderBy(events.startAt)
    .limit(limit)
    .offset(offset);

  // Also fetch recurring events whose startAt is BEFORE the window
  // (they may have instances within the window)
  const recurringMasters = await db
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
    .where(
      and(
        eq(events.isRecurring, true),
        lte(events.startAt, from),
        ...(category && VALID_CATEGORIES.includes(category)
          ? [eq(events.category, category)]
          : []),
        ...(groupId ? [eq(events.groupId, groupId)] : []),
      ),
    );

  // Separate recurring from non-recurring in the main result
  const nonRecurring = rows.filter((r) => !r.isRecurring);
  const recurringInWindow = rows.filter((r) => r.isRecurring);

  // Combine all recurring masters (from both queries, deduplicated)
  const allRecurringMap = new Map<string, (typeof rows)[number]>();
  for (const r of [...recurringInWindow, ...recurringMasters]) {
    allRecurringMap.set(r.id, r);
  }

  // Expand recurring events into virtual instances
  const virtualInstances = [];
  for (const master of allRecurringMap.values()) {
    const expanded = expandRecurrence(
      {
        id: master.id,
        title: master.title,
        description: master.description,
        location: master.location,
        startAt: master.startAt,
        endAt: master.endAt,
        category: master.category,
        isRecurring: master.isRecurring,
        recurrenceRule: master.recurrenceRule,
        creatorId: master.creatorId,
        createdAt: master.createdAt,
        updatedAt: master.updatedAt,
      },
      from,
      to,
    );
    for (const vi of expanded) {
      virtualInstances.push({
        ...vi,
        creatorName: master.creatorName,
        creatorAvatar: master.creatorAvatar,
        rsvpAttending: master.rsvpAttending,
        rsvpDeclined: master.rsvpDeclined,
        rsvpMaybe: master.rsvpMaybe,
        myRsvp: master.myRsvp,
      });
    }
  }

  // Merge non-recurring + virtual instances and sort by startAt
  const merged = [
    ...nonRecurring.map((r) => ({
      ...r,
      startAt: new Date(r.startAt).toISOString(),
      endAt: r.endAt ? new Date(r.endAt).toISOString() : null,
      createdAt: new Date(r.createdAt).toISOString(),
      updatedAt: new Date(r.updatedAt).toISOString(),
      virtualDate: null,
    })),
    ...virtualInstances,
  ].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

  return NextResponse.json({ events: merged });

  } catch (err) {
    console.error("[events GET]", err);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
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
  const { title, description, location, startAt, endAt, category, isRecurring, recurrenceRule, group_id } = body;

  // Validation
  if (!title || typeof title !== "string" || title.length > 200) {
    return NextResponse.json({ error: "title is required (max 200 chars)" }, { status: 400 });
  }

  if (!startAt) {
    return NextResponse.json({ error: "startAt is required" }, { status: 400 });
  }

  const parsedStart = new Date(startAt);
  if (isNaN(parsedStart.getTime())) {
    return NextResponse.json({ error: "Invalid startAt date" }, { status: 400 });
  }

  const parsedEnd = endAt ? new Date(endAt) : null;
  if (endAt && (!parsedEnd || isNaN(parsedEnd.getTime()))) {
    return NextResponse.json({ error: "Invalid endAt date" }, { status: 400 });
  }

  if (category && !VALID_CATEGORIES.includes(category)) {
    return NextResponse.json(
      { error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}` },
      { status: 400 },
    );
  }

  if (description && (typeof description !== "string" || description.length > 5000)) {
    return NextResponse.json({ error: "description must be string (max 5000 chars)" }, { status: 400 });
  }

  if (location && (typeof location !== "string" || location.length > 500)) {
    return NextResponse.json({ error: "location must be string (max 500 chars)" }, { status: 400 });
  }

  // Validate group membership if group_id is provided
  let resolvedGroupId: string | null = null;
  if (group_id) {
    if (typeof group_id !== "string") {
      return NextResponse.json({ error: "group_id must be a string" }, { status: 400 });
    }
    // Check group exists
    const groupExists = await db
      .select({ id: groups.id })
      .from(groups)
      .where(eq(groups.id, group_id))
      .then((rows) => rows[0] ?? null);

    if (!groupExists) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Caller must be a member of the group
    const member = await isGroupMember(group_id, session.sub);
    if (!member && session.role !== "admin") {
      return NextResponse.json(
        { error: "You must be a member of the group to create an event for it" },
        { status: 403 },
      );
    }
    resolvedGroupId = group_id;
  }

  // Only allow recurrenceRule if isRecurring is true
  const recurring = Boolean(isRecurring);
  const rule = recurring && recurrenceRule ? String(recurrenceRule) : null;

  const newEvent = await db
    .insert(events)
    .values({
      title,
      description: description || null,
      location: location || null,
      startAt: parsedStart,
      endAt: parsedEnd,
      category: category || null,
      isRecurring: recurring,
      recurrenceRule: rule,
      groupId: resolvedGroupId,
      creatorId: session.sub,
    })
    .returning();

  return NextResponse.json({ event: newEvent[0] }, { status: 201 });
}
