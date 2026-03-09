import { NextRequest, NextResponse } from "next/server";
import { eq, desc, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { posts, users } from "@/db/schema";
import { getSession } from "@/lib/auth";

type BoardType = "notice" | "free" | "column";
const validBoardTypes: BoardType[] = ["notice", "free", "column"];

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const typeParam = req.nextUrl.searchParams.get("type") || "free";
  const boardType: BoardType = validBoardTypes.includes(typeParam as BoardType)
    ? (typeParam as BoardType)
    : "free";
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit")) || 20, 50);
  const offset = Number(req.nextUrl.searchParams.get("offset")) || 0;

  const result = await db
    .select({
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
    })
    .from(posts)
    .leftJoin(users, eq(posts.authorId, users.id))
    .where(eq(posts.boardType, boardType))
    .orderBy(desc(posts.createdAt))
    .limit(limit)
    .offset(offset);

  return NextResponse.json({ posts: result });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, content, boardType } = await req.json();

  if (!title || !content || !boardType) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (typeof title !== "string" || typeof content !== "string" || title.length > 200 || content.length > 50000) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  if (!validBoardTypes.includes(boardType as BoardType)) {
    return NextResponse.json({ error: "Invalid board type" }, { status: 400 });
  }

  if (boardType === "notice" && session.role !== "admin") {
    return NextResponse.json({ error: "공지는 관리자만 작성할 수 있습니다." }, { status: 403 });
  }

  const newPost = await db
    .insert(posts)
    .values({
      title,
      content,
      boardType,
      authorId: session.sub,
    })
    .returning();

  return NextResponse.json({ post: newPost[0] }, { status: 201 });
}
