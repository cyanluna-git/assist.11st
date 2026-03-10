import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";

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
    const result = await db
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
      .leftJoin(users, eq(groups.leaderId, users.id))
      .where(eq(groups.id, id))
      .then((rows) => rows[0] ?? null);

    if (!result) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ group: result });
  } catch (err) {
    console.error("[groups/[id] GET]", err);
    return NextResponse.json(
      { error: "Failed to fetch group" },
      { status: 500 },
    );
  }
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
    .select({ leaderId: groups.leaderId })
    .from(groups)
    .where(eq(groups.id, id))
    .then((rows) => rows[0] ?? null);

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (existing.leaderId !== session.sub && session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const updates: Partial<typeof groups.$inferInsert> = {};

  if (body.name !== undefined) {
    if (typeof body.name !== "string" || body.name.trim().length === 0 || body.name.length > 100) {
      return NextResponse.json({ error: "Invalid name" }, { status: 400 });
    }
    updates.name = body.name.trim();
  }

  if (body.description !== undefined) {
    if (body.description !== null && (typeof body.description !== "string" || body.description.length > 2000)) {
      return NextResponse.json({ error: "Invalid description" }, { status: 400 });
    }
    updates.description = body.description;
  }

  if (body.category !== undefined) {
    updates.category = body.category || null;
  }

  if (body.imageUrl !== undefined) {
    updates.imageUrl = body.imageUrl || null;
  }

  if (body.maxMembers !== undefined) {
    if (body.maxMembers !== null) {
      if (typeof body.maxMembers !== "number" || !Number.isInteger(body.maxMembers) || body.maxMembers < 2) {
        return NextResponse.json(
          { error: "maxMembers must be an integer >= 2" },
          { status: 400 },
        );
      }
    }
    updates.maxMembers = body.maxMembers;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  try {
    await db.update(groups).set(updates).where(eq(groups.id, id));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[groups/[id] PATCH]", err);
    return NextResponse.json(
      { error: "Failed to update group" },
      { status: 500 },
    );
  }
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
    .select({ leaderId: groups.leaderId })
    .from(groups)
    .where(eq(groups.id, id))
    .then((rows) => rows[0] ?? null);

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (existing.leaderId !== session.sub && session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // group_members and group_posts cascade via ON DELETE CASCADE
    // Neon HTTP doesn't support transactions; cascade handles cleanup
    await db.delete(groups).where(eq(groups.id, id));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[groups/[id] DELETE]", err);
    return NextResponse.json(
      { error: "Failed to delete group" },
      { status: 500 },
    );
  }
}
