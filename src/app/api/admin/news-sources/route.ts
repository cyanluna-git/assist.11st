import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";

import { db } from "@/lib/db";
import { newsSources } from "@/db/schema";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sources = await db
    .select()
    .from(newsSources)
    .orderBy(desc(newsSources.createdAt));

  return NextResponse.json({ sources });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { name, feedUrl, category } = body;

  if (!name || !feedUrl) {
    return NextResponse.json(
      { error: "name과 feedUrl은 필수입니다." },
      { status: 400 },
    );
  }

  if (typeof name !== "string" || typeof feedUrl !== "string") {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const source = await db
    .insert(newsSources)
    .values({
      name,
      feedUrl,
      category: category ?? null,
    })
    .onConflictDoNothing({ target: newsSources.feedUrl })
    .returning();

  if (source.length === 0) {
    return NextResponse.json(
      { error: "이미 등록된 피드 URL입니다." },
      { status: 409 },
    );
  }

  return NextResponse.json({ source: source[0] }, { status: 201 });
}
