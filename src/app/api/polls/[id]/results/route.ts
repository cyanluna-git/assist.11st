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

  // Fetch poll
  const poll = await db
    .select({
      id: polls.id,
      title: polls.title,
      isAnonymous: polls.isAnonymous,
      isMultiple: polls.isMultiple,
      closesAt: polls.closesAt,
    })
    .from(polls)
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

  const totalVoteCount = options.reduce((sum, o) => sum + Number(o.voteCount), 0);

  // Build results per option with voters (if not anonymous)
  const optionResults = [];

  for (const option of options) {
    const count = Number(option.voteCount);
    const percentage =
      totalVoteCount > 0
        ? Math.round((count / totalVoteCount) * 1000) / 10
        : 0;

    let voters: { id: string; name: string }[] | undefined;

    if (!poll.isAnonymous) {
      const voterRows = await db
        .select({
          id: users.id,
          name: users.name,
        })
        .from(pollVotes)
        .innerJoin(users, eq(pollVotes.userId, users.id))
        .where(eq(pollVotes.pollOptionId, option.id));

      voters = voterRows;
    }

    optionResults.push({
      id: option.id,
      text: option.text,
      voteCount: count,
      percentage,
      ...(voters !== undefined ? { voters } : {}),
    });
  }

  return NextResponse.json({
    poll: {
      id: poll.id,
      title: poll.title,
      isAnonymous: poll.isAnonymous,
      isMultiple: poll.isMultiple,
      closesAt: poll.closesAt,
      totalVoters,
      totalVoteCount,
      options: optionResults,
    },
  });
}
