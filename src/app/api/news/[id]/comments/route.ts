import { NextRequest, NextResponse } from "next/server";
import { eq, asc } from "drizzle-orm";

import { db } from "@/lib/db";
import { newsComments, users } from "@/db/schema";
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

  const { id: articleId } = await params;

  const result = await db
    .select({
      id: newsComments.id,
      content: newsComments.content,
      parentId: newsComments.parentId,
      createdAt: newsComments.createdAt,
      authorId: newsComments.authorId,
      authorName: users.name,
      authorAvatar: users.avatarUrl,
    })
    .from(newsComments)
    .leftJoin(users, eq(newsComments.authorId, users.id))
    .where(eq(newsComments.articleId, articleId))
    .orderBy(asc(newsComments.createdAt));

  return NextResponse.json({ comments: result });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: articleId } = await params;
  const { content, parentId } = await req.json();

  if (!content || typeof content !== "string") {
    return NextResponse.json(
      { error: "Content is required" },
      { status: 400 },
    );
  }

  if (content.length > 2000) {
    return NextResponse.json(
      { error: "댓글은 2000자 이내로 작성해주세요." },
      { status: 400 },
    );
  }

  const newComment = await db
    .insert(newsComments)
    .values({
      articleId,
      authorId: session.sub,
      content,
      parentId: parentId || null,
    })
    .returning();

  return NextResponse.json({ comment: newComment[0] }, { status: 201 });
}
