import { NextRequest, NextResponse } from "next/server";
import { eq, desc, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { groups, groupPosts, users } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { isGroupMember } from "@/lib/groups";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
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

    // Members-only access
    const member = await isGroupMember(id, session.sub);
    if (!member && session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const sp = req.nextUrl.searchParams;
    const limit = Math.min(Number(sp.get("limit")) || 20, 100);
    const offset = Number(sp.get("offset")) || 0;

    const posts = await db
      .select({
        id: groupPosts.id,
        groupId: groupPosts.groupId,
        authorId: groupPosts.authorId,
        title: groupPosts.title,
        content: groupPosts.content,
        createdAt: groupPosts.createdAt,
        authorName: users.name,
        authorAvatar: users.avatarUrl,
      })
      .from(groupPosts)
      .leftJoin(users, eq(groupPosts.authorId, users.id))
      .where(eq(groupPosts.groupId, id))
      .orderBy(desc(groupPosts.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ posts });
  } catch (err) {
    console.error("[groups/[id]/posts GET]", err);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 },
    );
  }
}

export async function POST(
  req: NextRequest,
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

    // Members-only access
    const member = await isGroupMember(id, session.sub);
    if (!member && session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { title, content } = body;

    if (!title || typeof title !== "string" || title.trim().length === 0 || title.length > 200) {
      return NextResponse.json(
        { error: "title is required (max 200 chars)" },
        { status: 400 },
      );
    }

    if (!content || typeof content !== "string" || content.trim().length === 0 || content.length > 50000) {
      return NextResponse.json(
        { error: "content is required (max 50000 chars)" },
        { status: 400 },
      );
    }

    const [newPost] = await db
      .insert(groupPosts)
      .values({
        groupId: id,
        authorId: session.sub,
        title: title.trim(),
        content: content.trim(),
      })
      .returning();

    return NextResponse.json({ post: newPost }, { status: 201 });
  } catch (err) {
    console.error("[groups/[id]/posts POST]", err);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 },
    );
  }
}
