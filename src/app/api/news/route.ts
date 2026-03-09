import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, ilike, sql, or } from "drizzle-orm";

import { db } from "@/lib/db";
import { newsArticles, newsSources, users } from "@/db/schema";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const limit = Math.min(Number(searchParams.get("limit")) || 20, 50);
  const offset = Number(searchParams.get("offset")) || 0;
  const sourceId = searchParams.get("sourceId");
  const search = searchParams.get("search");

  const conditions = [];
  if (sourceId) {
    conditions.push(eq(newsArticles.sourceId, sourceId));
  }
  if (search) {
    conditions.push(
      or(
        ilike(newsArticles.title, `%${search}%`),
        ilike(newsArticles.summary, `%${search}%`),
      ),
    );
  }

  const where =
    conditions.length > 0 ? and(...conditions) : undefined;

  const articles = await db
    .select({
      id: newsArticles.id,
      title: newsArticles.title,
      summary: newsArticles.summary,
      url: newsArticles.url,
      imageUrl: newsArticles.imageUrl,
      publishedAt: newsArticles.publishedAt,
      isManual: newsArticles.isManual,
      createdAt: newsArticles.createdAt,
      sourceId: newsArticles.sourceId,
      sourceName: newsSources.name,
      sharedById: newsArticles.sharedById,
      sharedByName: users.name,
      commentCount: sql<number>`(SELECT COUNT(*) FROM news_comments WHERE news_comments.article_id = ${newsArticles.id})`,
    })
    .from(newsArticles)
    .leftJoin(newsSources, eq(newsArticles.sourceId, newsSources.id))
    .leftJoin(users, eq(newsArticles.sharedById, users.id))
    .where(where)
    .orderBy(desc(newsArticles.publishedAt), desc(newsArticles.createdAt))
    .limit(limit)
    .offset(offset);

  return NextResponse.json({ articles });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { title, url, summary, imageUrl } = body;

  if (!title || !url) {
    return NextResponse.json(
      { error: "title과 url은 필수입니다." },
      { status: 400 },
    );
  }

  if (
    typeof title !== "string" ||
    typeof url !== "string" ||
    title.length > 300 ||
    url.length > 2000
  ) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const article = await db
    .insert(newsArticles)
    .values({
      title,
      url,
      summary: summary ?? null,
      imageUrl: imageUrl ?? null,
      sharedById: session.sub,
      isManual: true,
      publishedAt: new Date(),
    })
    .onConflictDoNothing({ target: newsArticles.url })
    .returning();

  if (article.length === 0) {
    return NextResponse.json(
      { error: "이미 공유된 URL입니다." },
      { status: 409 },
    );
  }

  return NextResponse.json({ article: article[0] }, { status: 201 });
}
