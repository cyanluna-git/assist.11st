import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";

import { db } from "@/lib/db";
import { groups, groupMembers } from "@/db/schema";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Check group exists
    const group = await db
      .select({ leaderId: groups.leaderId })
      .from(groups)
      .where(eq(groups.id, id))
      .then((rows) => rows[0] ?? null);

    if (!group) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Leader cannot leave — they must transfer leadership or delete the group
    if (group.leaderId === session.sub) {
      return NextResponse.json(
        { error: "Leader cannot leave. Transfer leadership or delete the group." },
        { status: 400 },
      );
    }

    // Check membership exists
    const existing = await db
      .select({ id: groupMembers.id })
      .from(groupMembers)
      .where(
        and(eq(groupMembers.groupId, id), eq(groupMembers.userId, session.sub)),
      )
      .then((rows) => rows[0] ?? null);

    if (!existing) {
      return NextResponse.json(
        { error: "Not a member" },
        { status: 404 },
      );
    }

    await db
      .delete(groupMembers)
      .where(
        and(eq(groupMembers.groupId, id), eq(groupMembers.userId, session.sub)),
      );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[groups/[id]/leave DELETE]", err);
    return NextResponse.json(
      { error: "Failed to leave group" },
      { status: 500 },
    );
  }
}
