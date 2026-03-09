import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { newsArticles, newsSources, users } from "@/db/schema";
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

  const rows = await db
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
    .where(eq(newsArticles.id, id));

  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ article: rows[0] });
}
