import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { polls, pollOptions, pollVotes, users } from "@/db/schema";
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

  // Fetch poll with creator info
  const poll = await db
    .select({
      id: polls.id,
      title: polls.title,
      description: polls.description,
      isMultiple: polls.isMultiple,
      isAnonymous: polls.isAnonymous,
      closesAt: polls.closesAt,
      createdAt: polls.createdAt,
      creatorId: polls.creatorId,
      creatorName: users.name,
      creatorAvatar: users.avatarUrl,
    })
    .from(polls)
    .leftJoin(users, eq(polls.creatorId, users.id))
    .where(eq(polls.id, id))
    .then((rows) => rows[0] ?? null);

  if (!poll) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Fetch options with vote counts
  const options = await db
    .select({
      id: pollOptions.id,
      text: pollOptions.text,
      voteCount: sql<number>`(
        SELECT COUNT(*) FROM poll_votes pv WHERE pv.poll_option_id = ${pollOptions.id}
      )`,
    })
    .from(pollOptions)
    .where(eq(pollOptions.pollId, id));

  // Total unique voters
  const totalVoters = await db
    .select({
      count: sql<number>`COUNT(DISTINCT ${pollVotes.userId})`,
    })
    .from(pollVotes)
    .innerJoin(pollOptions, eq(pollVotes.pollOptionId, pollOptions.id))
    .where(eq(pollOptions.pollId, id))
    .then((rows) => Number(rows[0]?.count ?? 0));

  // Current user's voted option IDs
  const userVotes = await db
    .select({ pollOptionId: pollVotes.pollOptionId })
    .from(pollVotes)
    .innerJoin(pollOptions, eq(pollVotes.pollOptionId, pollOptions.id))
    .where(
      sql`${pollOptions.pollId} = ${id} AND ${pollVotes.userId} = ${session.sub}`,
    );

  const userVotedOptionIds = userVotes.map((v) => v.pollOptionId);

  // Compute percentages
  const totalVoteCount = options.reduce((sum, o) => sum + Number(o.voteCount), 0);
  const optionsWithPercentage = options.map((o) => ({
    ...o,
    voteCount: Number(o.voteCount),
    percentage:
      totalVoteCount > 0
        ? Math.round((Number(o.voteCount) / totalVoteCount) * 1000) / 10
        : 0,
  }));

  return NextResponse.json({
    poll: {
      ...poll,
      options: optionsWithPercentage,
      totalVoters,
      userVotedOptionIds,
    },
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

  const poll = await db
    .select({
      creatorId: polls.creatorId,
      isMultiple: polls.isMultiple,
      isAnonymous: polls.isAnonymous,
    })
    .from(polls)
    .where(eq(polls.id, id))
    .then((rows) => rows[0] ?? null);

  if (!poll) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (poll.creatorId !== session.sub && session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { title, description, closesAt, isMultiple, isAnonymous } = body;

  // Check if votes exist when trying to change isMultiple or isAnonymous
  if (isMultiple !== undefined || isAnonymous !== undefined) {
    const voteCount = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(pollVotes)
      .innerJoin(pollOptions, eq(pollVotes.pollOptionId, pollOptions.id))
      .where(eq(pollOptions.pollId, id))
      .then((rows) => Number(rows[0]?.count ?? 0));

    if (voteCount > 0) {
      if (
        (isMultiple !== undefined && isMultiple !== poll.isMultiple) ||
        (isAnonymous !== undefined && isAnonymous !== poll.isAnonymous)
      ) {
        return NextResponse.json(
          { error: "Cannot change isMultiple or isAnonymous after votes exist" },
          { status: 409 },
        );
      }
    }
  }

  const updates: Record<string, unknown> = {};
  if (title !== undefined) {
    if (typeof title !== "string" || title.trim().length === 0 || title.length > 200) {
      return NextResponse.json({ error: "Invalid title" }, { status: 400 });
    }
    updates.title = title.trim();
  }
  if (description !== undefined) {
    updates.description = description?.trim() || null;
  }
  if (closesAt !== undefined) {
    updates.closesAt = closesAt ? new Date(closesAt) : null;
  }
  if (isMultiple !== undefined) {
    updates.isMultiple = isMultiple === true;
  }
  if (isAnonymous !== undefined) {
    updates.isAnonymous = isAnonymous === true;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  await db.update(polls).set(updates).where(eq(polls.id, id));

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

  const poll = await db
    .select({ creatorId: polls.creatorId })
    .from(polls)
    .where(eq(polls.id, id))
    .then((rows) => rows[0] ?? null);

  if (!poll) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (poll.creatorId !== session.sub && session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.delete(polls).where(eq(polls.id, id));

  return NextResponse.json({ success: true });
}
