import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { groups, groupMembers, users } from "@/db/schema";
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

  try {
    // Check group exists
    const group = await db
      .select({ id: groups.id })
      .from(groups)
      .where(eq(groups.id, id))
      .then((rows) => rows[0] ?? null);

    if (!group) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const members = await db
      .select({
        id: groupMembers.id,
        userId: groupMembers.userId,
        joinedAt: groupMembers.joinedAt,
        name: users.name,
        email: users.email,
        avatarUrl: users.avatarUrl,
        company: users.company,
        position: users.position,
      })
      .from(groupMembers)
      .leftJoin(users, eq(groupMembers.userId, users.id))
      .where(eq(groupMembers.groupId, id))
      .orderBy(groupMembers.joinedAt);

    return NextResponse.json({ members });
  } catch (err) {
    console.error("[groups/[id]/members GET]", err);
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 },
    );
  }
}
