import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { newsSources } from "@/db/schema";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sources = await db
    .select({ id: newsSources.id, name: newsSources.name, category: newsSources.category })
    .from(newsSources)
    .where(eq(newsSources.isActive, true))
    .orderBy(newsSources.name);

  return NextResponse.json({ sources });
}
