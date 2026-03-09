import { NextResponse } from "next/server";
import { eq, desc, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { posts, users } from "@/db/schema";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const selectFields = {
    id: posts.id,
    title: posts.title,
    content: posts.content,
    boardType: posts.boardType,
    createdAt: posts.createdAt,
    updatedAt: posts.updatedAt,
    authorId: posts.authorId,
    authorName: users.name,
    authorAvatar: users.avatarUrl,
    reactionCount: sql<number>`(SELECT COUNT(*) FROM reactions WHERE reactions.post_id = ${posts.id})`,
    commentCount: sql<number>`(SELECT COUNT(*) FROM comments WHERE comments.post_id = ${posts.id})`,
  };

  const [notices, recentPosts] = await Promise.all([
    db
      .select(selectFields)
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .where(eq(posts.boardType, "notice"))
      .orderBy(desc(posts.createdAt))
      .limit(3),
    db
      .select(selectFields)
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .orderBy(desc(posts.createdAt))
      .limit(5),
  ]);

  return NextResponse.json({ notices, recentPosts });
}
