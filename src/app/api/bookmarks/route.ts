import { NextRequest, NextResponse } from "next/server";
import { and, eq, desc } from "drizzle-orm";

import { db } from "@/lib/db";
import { bookmarks, posts, newsArticles, thesis } from "@/db/schema";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

const VALID_TARGET_TYPES = ["post", "news", "thesis"] as const;
type TargetType = (typeof VALID_TARGET_TYPES)[number];

function isValidTargetType(v: unknown): v is TargetType {
  return VALID_TARGET_TYPES.includes(v as TargetType);
}

// ── GET /api/bookmarks ──────────────────────────────────────────────────────
// Query: ?target_type=post|news|thesis  (optional)

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const targetTypeParam = req.nextUrl.searchParams.get("target_type");
  const filter = isValidTargetType(targetTypeParam) ? targetTypeParam : null;

  const userId = session.sub;

  // Query each type in parallel, then merge & sort by createdAt desc
  const fetchPosts = async () => {
    if (filter && filter !== "post") return [];
    const rows = await db
      .select({
        id: bookmarks.id,
        targetType: bookmarks.targetType,
        targetId: bookmarks.targetId,
        createdAt: bookmarks.createdAt,
        title: posts.title,
        boardType: posts.boardType,
        url: posts.id, // we'll build the URL on the client
      })
      .from(bookmarks)
      .innerJoin(posts, eq(bookmarks.targetId, posts.id))
      .where(and(eq(bookmarks.userId, userId), eq(bookmarks.targetType, "post")))
      .orderBy(desc(bookmarks.createdAt));
    return rows.map((r) => ({
      ...r,
      url: `/posts/${r.url}`,
      boardType: r.boardType,
    }));
  };

  const fetchNews = async () => {
    if (filter && filter !== "news") return [];
    const rows = await db
      .select({
        id: bookmarks.id,
        targetType: bookmarks.targetType,
        targetId: bookmarks.targetId,
        createdAt: bookmarks.createdAt,
        title: newsArticles.title,
        url: newsArticles.url,
        sourceName: newsArticles.sourceId, // will not join source; use sourceId
      })
      .from(bookmarks)
      .innerJoin(newsArticles, eq(bookmarks.targetId, newsArticles.id))
      .where(
        and(eq(bookmarks.userId, userId), eq(bookmarks.targetType, "news")),
      )
      .orderBy(desc(bookmarks.createdAt));
    return rows.map((r) => ({
      id: r.id,
      targetType: r.targetType,
      targetId: r.targetId,
      createdAt: r.createdAt,
      title: r.title,
      url: r.url,
      boardType: null,
    }));
  };

  const fetchThesis = async () => {
    if (filter && filter !== "thesis") return [];
    const rows = await db
      .select({
        id: bookmarks.id,
        targetType: bookmarks.targetType,
        targetId: bookmarks.targetId,
        createdAt: bookmarks.createdAt,
        title: thesis.title,
        field: thesis.field,
        status: thesis.status,
      })
      .from(bookmarks)
      .innerJoin(thesis, eq(bookmarks.targetId, thesis.id))
      .where(
        and(eq(bookmarks.userId, userId), eq(bookmarks.targetType, "thesis")),
      )
      .orderBy(desc(bookmarks.createdAt));
    return rows.map((r) => ({
      ...r,
      url: `/thesis/${r.targetId}`,
      boardType: null,
    }));
  };

  const [postItems, newsItems, thesisItems] = await Promise.all([
    fetchPosts(),
    fetchNews(),
    fetchThesis(),
  ]);

  const all = [...postItems, ...newsItems, ...thesisItems].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return NextResponse.json({ bookmarks: all });
}

// ── POST /api/bookmarks ─────────────────────────────────────────────────────
// Body: { targetType: string, targetId: string }

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { targetType, targetId } = body as {
    targetType?: string;
    targetId?: string;
  };

  if (!targetType || !targetId) {
    return NextResponse.json(
      { error: "targetType and targetId are required" },
      { status: 400 },
    );
  }

  if (!isValidTargetType(targetType)) {
    return NextResponse.json(
      { error: "Invalid targetType. Must be post, news, or thesis" },
      { status: 400 },
    );
  }

  const userId = session.sub;

  // Idempotent: check for existing bookmark
  const existing = await db
    .select({ id: bookmarks.id })
    .from(bookmarks)
    .where(
      and(
        eq(bookmarks.userId, userId),
        eq(bookmarks.targetType, targetType),
        eq(bookmarks.targetId, targetId),
      ),
    )
    .then((rows) => rows[0] ?? null);

  if (existing) {
    return NextResponse.json(
      { bookmarked: true, bookmarkId: existing.id },
      { status: 200 },
    );
  }

  const inserted = await db
    .insert(bookmarks)
    .values({ userId, targetType, targetId })
    .returning();

  return NextResponse.json(
    { bookmarked: true, bookmarkId: inserted[0].id },
    { status: 201 },
  );
}

// ── DELETE /api/bookmarks ───────────────────────────────────────────────────
// Query: ?targetType=post&targetId=uuid

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const targetType = req.nextUrl.searchParams.get("targetType");
  const targetId = req.nextUrl.searchParams.get("targetId");

  if (!targetType || !targetId) {
    return NextResponse.json(
      { error: "targetType and targetId query params are required" },
      { status: 400 },
    );
  }

  const userId = session.sub;

  await db
    .delete(bookmarks)
    .where(
      and(
        eq(bookmarks.userId, userId),
        eq(bookmarks.targetType, targetType),
        eq(bookmarks.targetId, targetId),
      ),
    );

  return NextResponse.json({ bookmarked: false });
}
