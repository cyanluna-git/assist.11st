import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { newsSources, newsArticles } from "@/db/schema";
import { parseFeed } from "@/lib/rss";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch active sources
  const sources = await db
    .select()
    .from(newsSources)
    .where(eq(newsSources.isActive, true));

  // Process each feed with Promise.allSettled for graceful failure handling
  const results = await Promise.allSettled(
    sources.map(async (source) => {
      const articles = await parseFeed(source.feedUrl);
      let upserted = 0;

      for (const article of articles) {
        const res = await db
          .insert(newsArticles)
          .values({
            sourceId: source.id,
            title: article.title,
            summary: article.summary,
            url: article.url,
            imageUrl: article.imageUrl,
            publishedAt: article.publishedAt,
          })
          .onConflictDoUpdate({
            target: newsArticles.url,
            set: {
              title: sql`excluded.title`,
              summary: sql`excluded.summary`,
              imageUrl: sql`excluded.image_url`,
              updatedAt: sql`now()`,
            },
          })
          .returning({ id: newsArticles.id });

        if (res.length > 0) upserted++;
      }

      return { source: source.name, fetched: articles.length, upserted };
    }),
  );

  const summary = results.map((r, i) => {
    if (r.status === "fulfilled") return r.value;
    return {
      source: sources[i].name,
      error: r.reason instanceof Error ? r.reason.message : "Unknown error",
    };
  });

  return NextResponse.json({ success: true, feeds: summary });
}
