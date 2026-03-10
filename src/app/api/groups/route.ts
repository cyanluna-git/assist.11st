import { NextRequest, NextResponse } from "next/server";
import { eq, sql, desc } from "drizzle-orm";

import { db } from "@/lib/db";
import { groups, groupMembers, users } from "@/db/schema";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const category = sp.get("category");
  const limit = Math.min(Number(sp.get("limit")) || 20, 100);
  const offset = Number(sp.get("offset")) || 0;

  try {
    const query = db
      .select({
        id: groups.id,
        name: groups.name,
        description: groups.description,
        category: groups.category,
        imageUrl: groups.imageUrl,
        leaderId: groups.leaderId,
        leaderName: users.name,
        leaderAvatar: users.avatarUrl,
        maxMembers: groups.maxMembers,
        createdAt: groups.createdAt,
        memberCount: sql<number>`(SELECT COUNT(*) FROM group_members WHERE group_members.group_id = ${groups.id})`,
        isMember: sql<boolean>`EXISTS(SELECT 1 FROM group_members WHERE group_members.group_id = ${groups.id} AND group_members.user_id = ${session.sub})`,
      })
      .from(groups)
      .leftJoin(users, eq(groups.leaderId, users.id));

    if (category) {
      const rows = await query
        .where(eq(groups.category, category))
        .orderBy(desc(groups.createdAt))
        .limit(limit)
        .offset(offset);
      return NextResponse.json({ groups: rows });
    }

    const rows = await query
      .orderBy(desc(groups.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ groups: rows });
  } catch (err) {
    console.error("[groups GET]", err);
    return NextResponse.json(
      { error: "Failed to fetch groups" },
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

  const { name, description, category, imageUrl, maxMembers } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0 || name.length > 100) {
    return NextResponse.json(
      { error: "name is required (max 100 chars)" },
      { status: 400 },
    );
  }

  if (description && (typeof description !== "string" || description.length > 2000)) {
    return NextResponse.json(
      { error: "description must be string (max 2000 chars)" },
      { status: 400 },
    );
  }

  if (maxMembers !== undefined && maxMembers !== null) {
    if (typeof maxMembers !== "number" || !Number.isInteger(maxMembers) || maxMembers < 2) {
      return NextResponse.json(
        { error: "maxMembers must be an integer >= 2" },
        { status: 400 },
      );
    }
  }

  try {
    const [newGroup] = await db
      .insert(groups)
      .values({
        name: name.trim(),
        description: description || null,
        category: category || null,
        imageUrl: imageUrl || null,
        leaderId: session.sub,
        maxMembers: maxMembers ?? null,
      })
      .returning();

    // Auto-join: leader becomes the first member
    await db.insert(groupMembers).values({
      groupId: newGroup.id,
      userId: session.sub,
    });

    return NextResponse.json({ group: newGroup }, { status: 201 });
  } catch (err) {
    console.error("[groups POST]", err);
    return NextResponse.json(
      { error: "Failed to create group" },
      { status: 500 },
    );
  }
}
