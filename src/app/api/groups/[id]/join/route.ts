import { NextRequest, NextResponse } from "next/server";
import { eq, and, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { groups, groupMembers } from "@/db/schema";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Check the group exists
    const group = await db
      .select({ id: groups.id, maxMembers: groups.maxMembers })
      .from(groups)
      .where(eq(groups.id, id))
      .then((rows) => rows[0] ?? null);

    if (!group) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Duplicate prevention
    const existing = await db
      .select({ id: groupMembers.id })
      .from(groupMembers)
      .where(
        and(eq(groupMembers.groupId, id), eq(groupMembers.userId, session.sub)),
      )
      .then((rows) => rows[0] ?? null);

    if (existing) {
      return NextResponse.json(
        { error: "Already a member" },
        { status: 409 },
      );
    }

    // max_members check
    if (group.maxMembers !== null) {
      const countResult = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(groupMembers)
        .where(eq(groupMembers.groupId, id))
        .then((rows) => rows[0]);

      const currentCount = Number(countResult?.count ?? 0);
      if (currentCount >= group.maxMembers) {
        return NextResponse.json(
          { error: "Group is full" },
          { status: 409 },
        );
      }
    }

    const [membership] = await db
      .insert(groupMembers)
      .values({
        groupId: id,
        userId: session.sub,
      })
      .returning();

    return NextResponse.json({ membership }, { status: 201 });
  } catch (err) {
    console.error("[groups/[id]/join POST]", err);
    return NextResponse.json(
      { error: "Failed to join group" },
      { status: 500 },
    );
  }
}
