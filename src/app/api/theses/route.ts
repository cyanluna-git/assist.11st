import { NextRequest, NextResponse } from "next/server";
import { eq, desc, and, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { thesis, users, thesisReviews } from "@/db/schema";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const field = req.nextUrl.searchParams.get("field");
  const status = req.nextUrl.searchParams.get("status");
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit")) || 20, 50);
  const offset = Number(req.nextUrl.searchParams.get("offset")) || 0;

  const conditions = [];
  if (field) conditions.push(eq(thesis.field, field));
  if (status && ["draft", "submitted", "reviewed"].includes(status)) {
    conditions.push(eq(thesis.status, status as "draft" | "submitted" | "reviewed"));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const result = await db
    .select({
      id: thesis.id,
      title: thesis.title,
      abstract: thesis.abstract,
      field: thesis.field,
      status: thesis.status,
      fileUrl: thesis.fileUrl,
      createdAt: thesis.createdAt,
      updatedAt: thesis.updatedAt,
      authorId: thesis.authorId,
      authorName: users.name,
      authorAvatar: users.avatarUrl,
      avgRating: sql<number>`coalesce(avg(${thesisReviews.rating}), 0)`,
      reviewCount: sql<number>`count(${thesisReviews.id})`,
    })
    .from(thesis)
    .leftJoin(users, eq(thesis.authorId, users.id))
    .leftJoin(thesisReviews, eq(thesis.id, thesisReviews.thesisId))
    .where(where)
    .groupBy(thesis.id, users.name, users.avatarUrl)
    .orderBy(desc(thesis.createdAt))
    .limit(limit)
    .offset(offset);

  return NextResponse.json({ theses: result });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { title, abstract: abs, field } = body;

  if (!title || typeof title !== "string" || title.length > 300) {
    return NextResponse.json({ error: "Invalid title" }, { status: 400 });
  }

  const newThesis = await db
    .insert(thesis)
    .values({
      title,
      abstract: abs || null,
      field: field || null,
      status: "draft",
      authorId: session.sub,
    })
    .returning();

  return NextResponse.json({ thesis: newThesis[0] }, { status: 201 });
}
